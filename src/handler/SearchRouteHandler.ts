import IsbnService from "../service/IsbnService";
import { DynamoDb } from "../db/dao/DynamoDb";

export default class SearchRouteHandler {
  isbn: IsbnService;
  dynamoDb: DynamoDb;

  constructor(isbn: IsbnService, dynamoDb: DynamoDb) {
    this.isbn = isbn;
    this.dynamoDb = dynamoDb;
  }

  async conductSearch(inputQuery: string): Promise<ResultRow[]> {
    // Extract from the inputQuery string the filters and the actual search query
    const extractedObject: Filters = this.extractFilters(inputQuery);
    const extractedFilters = extractedObject.queryList; // TODO: Do something with this...
    console.log(extractedFilters);
    const extractedQuery = extractedObject.inputQuery;

    let isbnResult: undefined | string[];
    if (extractedQuery != null && extractedQuery !== "") {
      // First, get the target list of isbn numbers from the querystring.
      isbnResult = await this.dynamoDb.checkISBNQueryCache(extractedQuery);
      if (isbnResult == null) {
        console.log(`Submitting Query to ISBN: ${extractedQuery}`);
        isbnResult = await this.isbn.conductSearch(extractedQuery);
        await this.dynamoDb.updateISBNQueryCache(extractedQuery, isbnResult.toString());
      }
    }

    console.log(`Completed Search Query: ${inputQuery}`);
    console.log(`ISBN result list: ${await JSON.stringify(isbnResult)}`);

    // If isbnResult is null, pull all books from the db
    const result = [];
    const bookSet = new Set<string>();
    if (isbnResult == null) {
      isbnResult = await this.retrieveAllISBNs();
    }

    // Retrieve book set from metadata function for each matching isbn result.
    for (let i = 0; i < isbnResult.length; i++) {
      if (!bookSet.has(isbnResult[i])) {
        // Perhaps do this asynchronously to speed things up?
        const metadata = await this.retrieveMetadata(isbnResult[i]);
        // this just checks if there is any metadata first as {} is a possible return type
        // the cast is to make typescript happy
        if (Object.keys(metadata).length !== 0 && (metadata as ResultRow).id != null) {
          result.push(metadata);
          bookSet.add(isbnResult[i]);
        }
      }
    }

    return result;
  }

  private async retrieveMetadata(isbn: string): Promise<ResultRow | {}> {
    // TODO: Use MySQL for this. The Google Books API is dog slow for each of these queries
    const lookupURL = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const response = await fetch(lookupURL);
    const result = await response.json();

    if (result.items != null && result.items[0] != null) {
      const bookObj = result.items[0];
      return {
        id: bookObj.selfLink,
        isbn,
        title: bookObj.volumeInfo.title ?? "Unknown",
        author: bookObj.volumeInfo.authors != null && bookObj.volumeInfo.authors.length > 0 ? bookObj.volumeInfo.authors[0] : "Unknown",
        genre: bookObj.volumeInfo.categories ?? ["Unknown"],
        series: "N/A",
      };
    } else {
      return {};
    }
  }

  private async retrieveAllISBNs(): Promise<string[]> {
    // TODO: Use MySQL for this to do a select * on all books available.
    return ["123456789X", "987654321X"];
  }

  // Extraction schema is ||Key:Value||||Key:Value||{...}||Key:Value||Search%20Query
  private extractFilters(inputQuery: string): Filters {
    let queryIndexes = this.findIndexes(inputQuery);
    const queryList = [];

    while (queryIndexes != null) {
      let queryKey = inputQuery.slice(
        queryIndexes.firstDelimiterIndex + 1,
        queryIndexes.separatorIndex
      );
      let queryValue = inputQuery.slice(
        queryIndexes.separatorIndex + 1,
        queryIndexes.secondDelimiterIndex
      );
      queryList.push({ queryKey, queryValue });

      inputQuery = inputQuery.slice(queryIndexes.secondDelimiterIndex + 2, inputQuery.length);
      queryIndexes = this.findIndexes(inputQuery);
    }

    return { queryList, inputQuery };
  }

  private findIndexes(inputString: string): any {
    let firstDelimiterIndex = -1;
    let secondDelimiterIndex = -1;
    let separatorIndex = -1;

    if (inputString.length < 5) {
      return undefined;
    }

    for (let i = 0; i < inputString.length; i++) {
      if (i < inputString.length - 1) {
        if (inputString[i] === "|" && inputString[i + 1] === "|") {
          if (firstDelimiterIndex === -1) {
            firstDelimiterIndex = i + 1; // give the index of the left |
          } else if (secondDelimiterIndex === -1) {
            secondDelimiterIndex = i; // give the index of the right |
          }

          i += 1;
        } else if (inputString[i] === ":") {
          if (separatorIndex === -1) {
            separatorIndex = i;
          }
        }
      }
    }

    if (firstDelimiterIndex !== -1 && secondDelimiterIndex !== -1 && separatorIndex !== -1) {
      return { firstDelimiterIndex, separatorIndex: separatorIndex, secondDelimiterIndex };
    }
  }
}

export interface ResultRow {
  id: string | undefined;
  title: string | undefined;
  author: string | undefined;
  genre: string | undefined;
  series: string | undefined;
  isbn: string | undefined;
}

export interface Filters {
  queryList: { queryKey: string; queryValue: string }[];
  inputQuery: string;
}
