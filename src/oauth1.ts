import { joinUrl } from './utils';
import Config from './config';
import Popup from './popup';
import { IOAuth1Options } from './oauth1';

export interface IOAuth1 {
  init(options: any, data: any, userOptions: any): angular.IPromise<any>;
  getRequestToken(): angular.IHttpPromise<any>;
  openPopup(options: IOAuth1Options, response: angular.IHttpPromiseCallbackArg<any>): angular.IPromise<any>;
  exchangeForToken(oauthData: any, userData: any, userOptions: any): angular.IHttpPromise<any>;
  buildQueryString(obj: any): string;
}

export interface IOAuth1Options {
  name: string;
  url: string;
  authorizationEndpoint: string;
  redirectUri: string;
  scope: string[];
  scopePrefix: string;
  scopeDelimiter: string;
  requiredUrlParams: string[];
  defaultUrlParams: string[];
  oauthType: string;
  popupOptions: { width: number, height: number };
}

export default class OAuth1 implements IOAuth1 {
  static $inject = ['$http', '$window', 'SatellizerConfig', 'SatellizerPopup'];

  private defaults: IOAuth1Options;

  constructor(private $http: angular.IHttpService,
              private $window: angular.IWindowService,
              private SatellizerConfig: Config,
              private SatellizerPopup: Popup) {

    this.defaults = {
      name: null,
      url: null,
      authorizationEndpoint: null,
      scope: null,
      scopePrefix: null,
      scopeDelimiter: null,
      redirectUri: null,
      requiredUrlParams: null,
      defaultUrlParams: null,
      oauthType: '1.0',
      popupOptions: { width: null, height: null }
    };
  };

  init(options: IOAuth1Options, userData: any, userOptions: any): angular.IHttpPromise<any> {
    angular.extend(this.defaults, options);
    const { name, popupOptions } = options;
    const { redirectUri } = this.defaults;

    // Should open an empty popup and wait until request token is received
    if (!this.$window['cordova']) {
      this.SatellizerPopup.open('about:blank', name, popupOptions, redirectUri, true);
    }

    return this.getRequestToken().then((response) => {
      return this.openPopup(options, response).then((popupResponse) => {
        return this.exchangeForToken(popupResponse, userData, userOptions);
      });
    });
  }

  openPopup(options: IOAuth1Options, response: angular.IHttpPromiseCallbackArg<any>): angular.IPromise<any> {
    const url = [options.authorizationEndpoint, this.buildQueryString(response.data)].join('?');
    const { redirectUri } = this.defaults;

    if (this.$window['cordova']) {
      return this.SatellizerPopup.open(url, options.name, options.popupOptions, redirectUri);
    } else {
      this.SatellizerPopup.popup.location = url;
      return this.SatellizerPopup.polling(redirectUri);
    }
  }

  getRequestToken(): angular.IHttpPromise<any> {
    const url = this.SatellizerConfig.baseUrl ? joinUrl(this.SatellizerConfig.baseUrl, this.defaults.url) : this.defaults.url;
    return this.$http.post(url, this.defaults);
  }

  exchangeForToken(oauthData, userData, userOptions): angular.IHttpPromise<any> {
    const payload = angular.extend({}, userData, oauthData);
	const options = angular.extend({ withCredentials: this.SatellizerConfig.withCredentials }, userOptions);
    const exchangeForTokenUrl = this.SatellizerConfig.baseUrl ? joinUrl(this.SatellizerConfig.baseUrl, this.defaults.url) : this.defaults.url;
    return this.$http.post(exchangeForTokenUrl, payload, options);
  }

  buildQueryString(obj): string {
    const str = [];
    angular.forEach(obj, function (value, key) {
      str.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    });
    return str.join('&');
  }
}
