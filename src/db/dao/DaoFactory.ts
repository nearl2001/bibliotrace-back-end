import { Kysely } from "kysely";
import Database from "../schema/Database";
import AudienceDao from "./AudienceDao";
import AuditDao from "./AuditDao";
import AuditStateDao from "./AuditStateDao";
import BookDao from "./BookDao";
import CampusDao from "./CampusDao";
import CheckoutDao from "./CheckoutDao";
import GenresDao from "./GenresDao";
import GenreTypeDao from "./GenreTypeDao";
import InventoryDao from "./InventoryDao";
import SeriesDao from "./SeriesDao";
import SuggestionDao from "./SuggestionDao";
import TagDao from "./TagDao";
import UserDao from "./UserDao";
import UserRoleDao from "./UserRoleDao";
import LocationDao from "./LocationDao";
import RestockListDao from "./RestockListDao";
import ShoppingListDao from "./ShoppingListDao";

class DaoFactory {
  audienceDao: AudienceDao;
  auditDao: AuditDao;
  auditStateDao: AuditStateDao;
  bookDao: BookDao;
  campusDao: CampusDao;
  checkoutDao: CheckoutDao;
  genresDao: GenresDao;
  genreTypeDao: GenreTypeDao;
  inventoryDao: InventoryDao;
  locationDao: LocationDao;
  restockListDao: RestockListDao;
  seriesDao: SeriesDao;
  shoppingListDao: ShoppingListDao;
  suggestionDao: SuggestionDao;
  tagDao: TagDao;
  userDao: UserDao;
  userRoleDao: UserRoleDao;

  constructor(db: Kysely<Database>) {
    this.audienceDao = new AudienceDao(db);
    this.auditDao = new AuditDao(db);
    this.auditStateDao = new AuditStateDao(db);
    this.bookDao = new BookDao(db);
    this.campusDao = new CampusDao(db);
    this.checkoutDao = new CheckoutDao(db);
    this.genresDao = new GenresDao(db);
    this.genreTypeDao = new GenreTypeDao(db);
    this.inventoryDao = new InventoryDao(db);
    this.locationDao = new LocationDao(db);
    this.restockListDao = new RestockListDao(db);
    this.seriesDao = new SeriesDao(db);
    this.shoppingListDao = new ShoppingListDao(db);
    this.suggestionDao = new SuggestionDao(db);
    this.tagDao = new TagDao(db);
    this.userDao = new UserDao(db);
    this.userRoleDao = new UserRoleDao(db);
  }

  getAudienceDao(): AudienceDao {
    return this.audienceDao;
  }

  getAuditDao(): AuditDao {
    return this.auditDao;
  }

  getAuditStateDao(): AuditStateDao {
    return this.auditStateDao;
  }

  getBookDao(): BookDao {
    return this.bookDao;
  }

  getCampusDao(): CampusDao {
    return this.campusDao;
  }

  getCheckoutDao(): CheckoutDao {
    return this.checkoutDao;
  }

  getGenresDao(): GenresDao {
    return this.genresDao;
  }

  getGenreTypeDao(): GenreTypeDao {
    return this.genreTypeDao;
  }

  getInventoryDao(): InventoryDao {
    return this.inventoryDao;
  }

  getLocationDao(): LocationDao {
    return this.locationDao;
  }

  getRestockListDao(): RestockListDao {
    return this.restockListDao;
  }

  getSeriesDao(): SeriesDao {
    return this.seriesDao;
  }

  getShoppingListDao(): ShoppingListDao {
    return this.shoppingListDao;
  }

  getSuggestionDao(): SuggestionDao {
    return this.suggestionDao;
  }

  getTagDao(): TagDao {
    return this.tagDao;
  }

  getUserDao(): UserDao {
    return this.userDao;
  }

  getUserRoleDao(): UserRoleDao {
    return this.userRoleDao;
  }
}

export default DaoFactory;
