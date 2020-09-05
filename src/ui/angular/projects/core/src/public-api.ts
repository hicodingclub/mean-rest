/*
 * Public API Surface of core
 */
export { ViewType, MddsBaseComponent } from "./lib/base.component";
export { MddsUncategorized } from "./lib/base.component";
export { MddsBaseComponentInterface } from "./lib/base.interface";
export { MddsServiceError, MddsBaseService } from "./lib/base.service";
export { MddsCommonService } from "./lib/mdds-common.service";
export { MDDSLoaderComponent } from './lib/loader.component';

export { MddsCoreModule } from "./lib/mdds-core.module";
export {
  MddsDirectiveArrayRequired,
  MddsDirectiveMapRequired,
  MddsDirectiveMultiSelectionRequired,
} from "./lib/mdds-common.directives";

export {
  ErrorToastConfig,
  ErrorToast,
  onServiceError,
  onServiceErrorMsg,
} from "./lib/util.errortoast";
export { ModalConfig, Modal } from "./lib/util.modal";
export { SnackBarConfig, SnackBar } from "./lib/util.snackbar";

export { MddsRouteReuseStrategy } from "./lib/route-reuse-strategy";
export { MDDS_ROUTE_REUSE_RUIs } from "./lib/route-reuse.tokens";

export * from "./lib/anchor.pipe";

// Bootstrap
export {
  MDDS_NGB_DATE_FORMAT,
  MraNgbDateFormatterService,
} from "./lib/bootstrap/ngb-date-formatter";
