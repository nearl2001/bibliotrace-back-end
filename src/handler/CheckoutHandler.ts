import RequestErrorResponse from "../db/response/RequestErrorResponse";
import SuccessResponse from "../db/response/SuccessResponse";
import CheckoutService from "../service/CheckoutService";

export class CheckoutHandler {
  checkoutService: CheckoutService;

  constructor(checkoutService: CheckoutService) {
    this.checkoutService = checkoutService;
  }

  public async checkout(body, authData) {
    if (!body.qr_code) {
      return new RequestErrorResponse("QR code is required", 400);
    }
    const campus = authData.userRole.campus;

    if (campus == null) {
      return new RequestErrorResponse("Missing Campus Data in Authentication", 400);
    }

    const [response, book_obj] = await this.checkoutService.checkout(
      body.qr_code,
      campus
    );

    if (response.statusCode !== 200) {
      return response;
    }
    return new SuccessResponse("Checked out successfully", {
      title: book_obj.book_title,
      author: book_obj.author,
      isbn: book_obj.isbn_list,
    });
  }

  public async checkin(body, authData) {
    if (!body.qr_code) {
      return new RequestErrorResponse("QR code is required", 400);
    } else if (!body.location_id) {
      return new RequestErrorResponse("Location is required", 400);
    }

    const campus = authData.userRole.campus;
    if (campus == null) {
      return new RequestErrorResponse("Missing Campus Data in Authentication", 400);
    }

    const [response, book_obj] = await this.checkoutService.checkin(
      body.qr_code,
      body.location_id,
      campus
    );

    if (response.statusCode !== 200) {
      return response;
    }
    return new SuccessResponse("Checked in successfully", {
      title: book_obj.book_title,
      author: book_obj.author,
      isbn: book_obj.isbn_list,
    });
  }
}
