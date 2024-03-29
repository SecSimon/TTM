import { Injectable } from '@angular/core';

export enum LocStorageKeys {
  AUTH_KEEP_SIGNED_IN         = "keep_signed_in",
  AUTH_ACCESS_TOKEN           = "auth_access_token",
  AUTH_GUEST                  = "auth_guest",
  AUTH_LAST_CODE              = "auth_last_code",
  COOKIE_CONSENT              = "cookie_consent",
  CURRENT_VERSION             = "current_verison",
  CVE_SEARCH_HISTORY          = "cve_search_history",
  DARK_MODE                   = "dark_mode",
  DIALOG_WARNING_CONSENT      = "dialog_warning_consent",
  GH_ACCOUNT_NAME             = "github_account_name",
  GH_USER_NAME                = "github_user_name",
  GH_USER_URL                 = "github_user_url",
  GH_USER_EMAIL               = "github_user_email",
  LANGUAGE                    = "language",
  LAST_FILE                = "last_project",
  MSG_SHOW_ERROR              = "msg_show_error",
  MSG_SHOW_WARNING            = "msg_show_warning",
  MSG_SHOW_SUCCESS            = "msg_show_success",
  MSG_SHOW_INFO               = "msg_show_info",
  MSG_SHOW_UNSAVED_CHANGED    = "msg_show_unsaved_changes",
  PAGE_CONFIG_TAB_INDEX       = "page_config_tab_index",
  PAGE_CONFIG_SPLIT_SIZE_1    = "page_config_split_size_1",
  PAGE_CONFIG_CHECKLISTS_TAB_INDEX = "page_config_checklists_tab_index",
  PAGE_CONFIG_CHECKLISTS_SPLIT_SIZE_X = "page_config_checklists_split_size_",
  PAGE_CONFIG_COMPONENTS_TAB_INDEX = "page_config_components_tab_index",
  PAGE_CONFIG_STENCILS_TAB_INDEX = "page_config_stencils_tab_index",
  PAGE_DASHBOARD_SPLIT_SIZE_X  = "page_dashboard_split_size_",
  PAGE_MITIGATION_SPLIT_SIZE_X  = "page_mitigation_split_size_",
  PAGE_MODELING_SPLIT_SIZE_X  = "page_modeling_split_size_",
  PAGE_MODELING_ASSETS_SPLIT_SIZE_X = "page_modeling_assets_split_size_",
  PAGE_MODELING_ASSETS_TAB_INDEX = "page_modeling_assets_tab_index",
  PAGE_MODELING_CONTAINERTREE_KEEP_STRUC ="page_modeling_containertree_keep_struc",
  PAGE_MODELING_CONTAINERTREE_SHOW_SCEN ="page_modeling_containertree_show_scen",
  PAGE_MODELING_CONTAINERTREE_SHOW_MEAS ="page_modeling_containertree_show_meas",
  PAGE_MODELING_DIAGRAM_ANCHOR_COUNT = "page_modeling_diagram_anchor_count",
  PAGE_MODELING_DIAGRAM_ARROW_BEND ="page_modeling_diagram_arrow_bend",
  PAGE_MODELING_DIAGRAM_ARROW_NAME ="page_modeling_diagram_arrow_name",
  PAGE_MODELING_DIAGRAM_ARROW_POS ="page_modeling_diagram_arrow_pos",
  PAGE_MODELING_DIAGRAM_SHOW_GRID ="page_modeling_diagram_show_grid",
  PAGE_MODELING_DIAGRAM_STICK_GRID ="page_modeling_diagram_stick_grid",
  PAGE_MODELING_DIAGRAM_TEXTSIZE_INDEX ="page_modeling_diagram_textsize_index",
  PAGE_MODELING_DIAGRAM_ZOOM  = "page_modeling_diagram_zoom",
  PAGE_MODELING_MODEL_TAB_INDEX   = "page_modeling_model_tab_index",
  PAGE_MODELING_THREAT_IDENT_TAB_INDEX = "page_modeling_threat_ident_tab_index",
  PAGE_REPORTING_DIAGRAM_SHOW_GRID  = "page_reporting_diagram_show_grid",
  PAGE_REPORTING_SHOW_CHARTS  = "page_reporting_show_charts",
  PAGE_REPORTING_SHOW_FIRST_STEPS  = "page_reporting_show_first_steps",
  PAGE_REPORTING_SHOW_TEST_CASES  = "page_reporting_show_test_cases",
  PAGE_RISK_SPLIT_SIZE_X      = "page_risk_split_size_",
  FILE_HISTORY             = "project_history",
  SPELL_CHECK                 = "spell_check",
  WELCOME_TOUR_STARTED        = "welcome_tour_started"
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
