import Config from './config';

export default class Storage {
  static $inject = ['$window', 'SatellizerConfig'];

  private memoryStore: any;
  private storageType: string;
  private isStorageAvailable: boolean;

  constructor(private $window: angular.IHttpService,
              private SatellizerConfig: Config) {
    this.memoryStore = {};

    try {
      var supported = this.SatellizerConfig.storageType in $window && $window[this.SatellizerConfig.storageType] !== null;
      if(supported) {
      var key = Math.random().toString(36).substring(7);
      $window[this.SatellizerConfig.storageType].setItem(key, '');
      $window[this.SatellizerConfig.storageType].removeItem(key);
    }
    this.isStorageAvailable = supported;
    } catch(e) {
      this.isStorageAvailable = false;
    }
  }

  get(key: string): string {
    if(this.isStorageAvailable) {
      return this.$window[this.SatellizerConfig.storageType].getItem(key);
    } else {
      return this.memoryStore[key];
    }
  }

  set(key: string, value: string): void {
    if(this.isStorageAvailable) {
      this.$window[this.SatellizerConfig.storageType].setItem(key, value);
    } else {
      this.memoryStore[key] = value;
    }
  }

  remove(key: string): void {
    if(this.isStorageAvailable) {
      this.$window[this.SatellizerConfig.storageType].removeItem(key);
    } else {
      delete this.memoryStore[key];
    }
  }
}
