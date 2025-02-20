import express from "express";
import { Config, sendResponse, validateUserType } from "../config";

export const inventoryRouter = express.Router();

inventoryRouter.put("/insert", async (req, res) => {
  if (validateUserType(req, res, "Admin")) {
    const response = await Config.dependencies.inventoryHandler.insertBook(req.body);
    sendResponse(res, response);
  }
});

inventoryRouter.get("/get/:isbn", async (req, res) => {
  const isbn = req.params.isbn;
  const response = await Config.dependencies.inventoryHandler.getByIsbn(isbn);
  sendResponse(res, response);
});

module.exports = { inventoryRouter };
