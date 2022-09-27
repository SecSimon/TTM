import { Injectable } from '@angular/core';

export enum LocStorageKeys {
  AUTH_KEEP_SIGNED_IN         = "keep_signed_in",
  AUTH_ACCESS_TOKEN           = "auth_access_token",
  AUTH_LAST_CODE              = "auth_last_code",
  CURRENT_VERSION             = "current_verison",
  DARK_MODE                   = "dark_mode",
  GH_ACCOUNT_NAME             = "github_account_name",
  GH_USER_NAME                = "github_user_name",
  GH_USER_URL                 = "github_user_url",
  GH_USER_EMAIL               = "github_user_email",
  GH_LAST_PROJECT             = "github_last_project",
  LANGUAGE                    = "language",
  MSG_SHOW_ERROR              = "msg_show_error",
  MSG_SHOW_WARNING            = "msg_show_warning",
  MSG_SHOW_SUCCESS            = "msg_show_success",
  MSG_SHOW_INFO               = "msg_show_info",
  PAGE_CONFIG_TAB_INDEX       = "page_config_tab_index",
  PAGE_CONFIG_SPLIT_SIZE_1    = "page_config_split_size_1",
  PAGE_CONFIG_CHECKLISTS_TAB_INDEX = "page_config_checklists_tab_index",
  PAGE_CONFIG_CHECKLISTS_SPLIT_SIZE_X = "page_config_checklists_split_size_",
  PAGE_CONFIG_COMPONENTS_TAB_INDEX = "page_config_components_tab_index",
  PAGE_CONFIG_STENCILS_TAB_INDEX = "page_config_stencils_tab_index",
  PAGE_DASHBOARD_COLOR_SCHEME = "page_dashboard_color_scheme",
  PAGE_DASHBOARD_SPLIT_SIZE_X  = "page_dashboard_split_size_",
  PAGE_MITIGATION_SPLIT_SIZE_X  = "page_mitigation_split_size_",
  PAGE_MODELING_SPLIT_SIZE_X  = "page_modeling_split_size_",
  PAGE_MODELING_ASSETS_SPLIT_SIZE_X = "page_modeling_assets_split_size_",
  PAGE_MODELING_ASSETS_TAB_INDEX = "page_modeling_assets_tab_index",
  PAGE_MODELING_DIAGRAM_ARROW_BEND ="page_modeling_diagram_arrow_bend",
  PAGE_MODELING_DIAGRAM_ARROW_NAME ="page_modeling_diagram_arrow_name",
  PAGE_MODELING_DIAGRAM_ARROW_POS ="page_modeling_diagram_arrow_pos",
  PAGE_MODELING_DIAGRAM_SHOW_GRID ="page_modeling_diagram_show_grid",
  PAGE_MODELING_THREAT_IDENT_TAB_INDEX = "page_modeling_threat_ident_tab_index",
  PAGE_REPORTING_DIAGRAM_SHOW_GRID  = "page_reporting_diagram_show_grid",
  PAGE_REPORTING_SHOW_CHARTS  = "page_reporting_show_charts",
  WELCOME_TOUR_STARTED      = "welcome_tour_started"
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  public Set(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  public Get(key: string) {
    return localStorage.getItem(key);
  }

  public Remove(key: string) {
    localStorage.removeItem(key);
  }

  public Clear() {
    localStorage.clear();
  }

  public ResetLayout() {
    this.Remove(LocStorageKeys.PAGE_CONFIG_SPLIT_SIZE_1);
    for (let i = 0; i < 5; i++) {
      this.Remove(LocStorageKeys.PAGE_CONFIG_CHECKLISTS_SPLIT_SIZE_X + i.toString());
      this.Remove(LocStorageKeys.PAGE_DASHBOARD_SPLIT_SIZE_X + i.toString());
      this.Remove(LocStorageKeys.PAGE_DASHBOARD_SPLIT_SIZE_X + i.toString());
      this.Remove(LocStorageKeys.PAGE_MITIGATION_SPLIT_SIZE_X + i.toString());
      this.Remove(LocStorageKeys.PAGE_MODELING_ASSETS_SPLIT_SIZE_X + i.toString());
    }
  }
}
