import express from "express";
import { Config } from "../config";
import { sendResponse } from "../utils/utils";

export const metadataRouter = express.Router();

metadataRouter.get("/genre", async (req, res) => {
  const response = await Config.dependencies.genreTagHandler.getGenres();

  sendResponse(res, response);
});

metadataRouter.get("/tag", async (req: any, res) => {
  const response = await Config.dependencies.genreTagHandler.getAllTags(req.auth);
  sendResponse(res, response);
});

metadataRouter.get("/audiences", async (req, res) => {
  try {
    const audiences = await Config.dependencies.filterTypeRoutesHandler.getAudiences();

    if (audiences != null && audiences.length > 0) {
      res.send({ results: audiences });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

metadataRouter.get("/campuses", async (req: any, res) => {
  try {
    const response = await Config.dependencies.filterTypeRoutesHandler.getCampuses();

    if (response != null && response.length > 0) {
      res.send({ results: response });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

metadataRouter.get("/locations", async (req: any, res) => {
  const response = await Config.dependencies.locationHandler.getLocationsForCampus(req.auth);
  sendResponse(res, response);
});

metadataRouter.post("/locations", async (req: any, res) => {
  console.log(req.body);
  const response = await Config.dependencies.locationHandler.addNewLocation(req.auth, req.body.locationName);
  sendResponse(res, response);
});

metadataRouter.put("/locations/:id", async (req: any, res) => {
  console.log(req.body);
  const response = await Config.dependencies.locationHandler.updateLocation(
    req.auth,
    req.params.id,
    req.body.locationName
  );
  sendResponse(res, response);
});
