import { Book } from "../db/schema/Book";
import { Campus } from "../db/schema/Campus";
import { Checkout } from "../db/schema/Checkout";
import { Inventory } from "../db/schema/Inventory";
import Response from "../response/Response";
import SuccessResponse from "../response/SuccessResponse";
import Service from "./Service";
import DaoFactory from "../db/dao/DaoFactory";
import ServerErrorResponse from "../response/ServerErrorResponse";
import { GenreType } from "../db/schema/GenreType";
import { Audience } from "../db/schema/Audience";

const MAX_TTL = 60 * 24 * 7; // 1 week in minutes

export default class BookManagementService extends Service {
  constructor(daoFactory: DaoFactory) {
    super(daoFactory);
  }

  public async getByIsbn(isbn: string): Promise<Response<Book>> {
    return await this.bookDao.getBookByIsbn(isbn);
  }

  public async getByQr(qr: string): Promise<Response<any>> {
    return await this.inventoryDao.getBookDataFromQr(qr);
  }

  public async setLocationByQr(qr: string, location: number): Promise<Response<any>> {
    return await this.inventoryDao.setLocation(qr, location);
  }

  public async getByTitle(title: string): Promise<Response<Book>> {
    return await this.bookDao.getBookByName(title);
  }

  public async getTagsByIsbn(isbn: string): Promise<Response<any>> {
    return await this.bookDao.getBookTagsByIsbn(isbn);
  }

  private async updateBookByTitle(request: Book): Promise<Response<any>> {
    const title = request.book_title;
    const bookResponse = await this.getByTitle(title);
    if (bookResponse.statusCode !== 200) {
      return bookResponse;
    } else if (!bookResponse.object) {
      return new ServerErrorResponse(`No book found with title ${title} to update`);
    }
    const book = bookResponse.object; // guaranteed to exist here
    const updatedInformation: any = { ...request };
    if (request.isbn_list != null && !book.isbn_list.includes(request.isbn_list)) {
      // The isbn number from the request isn't in the book response
      const updatedIsbnList = book.isbn_list + `|${request.isbn_list}`;
      updatedInformation.isbn_list = updatedIsbnList;
    } else if (request.isbn_list != null && book.isbn_list.includes(request.isbn_list)) {
      updatedInformation.isbn_list = book.isbn_list;
    }
    return await this.bookDao.update(book.id, updatedInformation);
  }

  // TODO: this should roll back if any of the requests fail with transaction stuff
  public async insertBook(request: BookInsertRequest) {
    // check ISBN first because it's faster to match on than book name string
    let bookResponse;
    if (request.isbn) {
      bookResponse = await this.bookDao.getBookByIsbn(this.parseIsbnList(request.isbn)[0]);
      // check by title if the isbn doesn't work
      if (bookResponse.statusCode !== 200 || !bookResponse.object) {
        bookResponse = await this.bookDao.getBookByName(request.book_title);
      }
    } else {
      bookResponse = await this.bookDao.getBookByName(request.book_title);
    }

    if (bookResponse.statusCode === 500 || bookResponse.message.includes("No book found")) {
      // book does not already exist in book table
      bookResponse = await this.parseBook(request);
      if (bookResponse.statusCode != 200) {
        return bookResponse;
      }
      bookResponse = await this.bookDao.create(bookResponse.object);
      if (bookResponse.statusCode != 200) {
        return bookResponse;
      }
    } else if (bookResponse.statusCode === 200) {
      // book already exists in book table
      bookResponse = await this.parseBook(request);
      if (bookResponse.statusCode != 200) {
        return bookResponse;
      }
      const updateResponse = await this.updateBookByTitle(bookResponse.object as Book);
      if (updateResponse.statusCode !== 200) {
        return updateResponse;
      }
    }

    // Get the target book
    bookResponse = await this.bookDao.getBookByIsbn(this.parseIsbnList(request.isbn)[0]);
    console.log(bookResponse);
    if (bookResponse.statusCode !== 200 || !bookResponse.object) {
      // we can't find the book we just created lol
      return new ServerErrorResponse(bookResponse.message);
    }

    const inventoryParseResponse = await this.parseInventory(request, bookResponse.object.id);
    if (inventoryParseResponse.statusCode != 200) {
      return inventoryParseResponse;
    }

    const inventoryResponse = (await this.inventoryDao.create(
      inventoryParseResponse.object as Inventory
    )) as Response<Inventory>;
    if (inventoryResponse.message.includes("already exists")) {
      return await this.inventoryDao.update(request.qr, inventoryParseResponse.object as Inventory);
      // updating an existing inventory item should not trigger a new checkout, thus we return here
    } else if (inventoryResponse.statusCode !== 200) {
      return inventoryResponse;
    }

    const checkout: Checkout = {
      timestamp: new Date().toISOString().slice(0, 19).replace("T", " "), // TODO: make sure this matches what MySQL expects
      qr: request.qr,
      book_id: bookResponse.object.id,
      state: "First",
    };

    const checkoutResponse = await this.checkoutDao.create(checkout);
    if (checkoutResponse.statusCode != 200) {
      return checkoutResponse;
    }

    return new SuccessResponse(`Book ${bookResponse.object.book_title} successfully created`);
  }

  private async parseBook(
    bookRequest: BookInsertRequest
  ): Promise<Response<Book | GenreType[] | Audience[]>> {
    console.log(bookRequest, "Book Request about to be parsed...");
    const genreIdResponse = await this.genreTypeDao.getAllMatchingOnIndex(
      "genre_name",
      bookRequest.primary_genre
    );
    if (genreIdResponse.statusCode !== 200) {
      return genreIdResponse;
    }
    const primary_genre_id = genreIdResponse.object[0].id;

    const audienceIdResponse = await this.audienceDao.getAllMatchingOnIndex(
      "audience_name",
      bookRequest.audience
    );
    if (audienceIdResponse.statusCode !== 200) {
      return audienceIdResponse;
    }
    const audience_id = audienceIdResponse.object[0].id;

    const book: Book = {
      book_title: bookRequest.book_title,
      isbn_list: bookRequest.isbn,
      author: bookRequest.author,
      primary_genre_id,
      audience_id,
    };

    if (bookRequest.pages) {
      book.pages = bookRequest.pages;
    }
    if (bookRequest.series_name) {
      let seriesResponse: Response<any> = await this.seriesDao.getByKeyAndValue(
        "series_name",
        bookRequest.series_name
      );
      if (seriesResponse.statusCode !== 200) {
        return seriesResponse;
      } else if (!seriesResponse.object) {
        // query executed successfully, but no series found
        seriesResponse = await this.seriesDao.create({
          series_name: bookRequest.series_name,
        });
        if (seriesResponse.statusCode !== 200) {
          return seriesResponse;
        }
      }
      book.series_id = seriesResponse.object.id;
    }
    if (bookRequest.series_number) {
      book.series_number = bookRequest.series_number;
    }
    if (bookRequest.publish_date) {
      book.publish_date = bookRequest.publish_date;
    }
    if (bookRequest.short_description) {
      book.short_description = bookRequest.short_description;
    }
    if (bookRequest.language) {
      book.language = bookRequest.language;
    }
    if (bookRequest.img_callback) {
      book.img_callback = bookRequest.img_callback;
    }

    return new SuccessResponse<Book>("Successfully parsed book", book);
  }

  private async parseInventory(
    request: BookInsertRequest,
    book_id: number
  ): Promise<Response<Campus | Inventory>> {
    const campusResponse = await this.campusDao.getByKeyAndValue("campus_name", request.campus);
    if (campusResponse.statusCode !== 200) {
      return campusResponse;
    }
    const campus_id = campusResponse.object.id;

    const inventory: Inventory = {
      qr: request.qr,
      book_id: book_id,
      location_id: request.location_id,
      campus_id: campus_id,
      ttl: MAX_TTL,
    };

    return new SuccessResponse<Inventory>("Successfully parsed inventory", inventory);
  }

  private parseIsbnList(isbnList: string): string[] {
    return isbnList.split("||");
  }
}

export interface BookInsertRequest {
  book_title: string;
  isbn?: string; // this unfortunately needs to be optional because some ISBNs have been obscured or are illegible
  author: string;
  primary_genre: string;
  audience: string;
  pages?: number;
  series_name?: string;
  series_number?: number;
  publish_date?: number;
  short_description?: string;
  language?: string;
  img_callback?: string;
  qr: string;
  location_id: number;
  campus: string;
}
