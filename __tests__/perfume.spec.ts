import Perfume from '../src/perfume';
import mock, { MockDateNowValue } from './_mock';

describe('Perfume', () => {
  let perfume: Perfume;
  let spy: jest.SpyInstance;

  beforeEach(() => {
    perfume = new Perfume({ ...mock.defaultPerfumeConfig });
    mock.performance();
    (window as any).ga = undefined;
    (window as any).PerformanceObserver = mock.PerformanceObserver;
    (window as any).console.log = (n: any) => n;
    (window as any).console.warn = (n: any) => n;
    perfume['observers']['firstPaint'] = () => 400;
    perfume['observers']['firstContentfulPaint'] = () => 400;
    perfume['observers']['firstInputDelay'] = () => 400;
    perfume['observers']['dataConsumption'] = () => 400;
    perfume['queue'] = {
      pushTask: (cb: any) => cb(),
    };
    perfume['perfObservers'] = {};
  });

  afterEach(() => {
    if (spy) {
      spy.mockReset();
      spy.mockRestore();
    }
  });

  describe('config', () => {
    const instance = new Perfume();

    it('should be defined', () => {
      expect(instance.config.firstContentfulPaint).toEqual(false);
      expect(instance.config.firstPaint).toEqual(false);
      expect(instance.config.firstInputDelay).toEqual(false);
      expect(instance.config.dataConsumption).toEqual(false);
      expect(instance.config.navigationTiming).toEqual(false);
      expect(instance.config.analyticsTracker).toBeDefined();
      expect(instance.config.browserTracker).toEqual(false);
      expect(instance.config.logPrefix).toEqual('Perfume.js:');
      expect(instance.config.logging).toEqual(true);
      expect(instance.config.maxMeasureTime).toEqual(15000);
      expect(instance.config.maxDataConsumption).toEqual(20000);
      expect(instance.config.warning).toEqual(false);
      expect(instance.config.debugging).toEqual(false);
    });
  });

  describe('constructor', () => {
    it('should run with config version A', () => {
      new Perfume({
        firstContentfulPaint: true,
        firstPaint: true,
        firstInputDelay: true,
        dataConsumption: true,
      });
    });

    it('should run with config version B', () => {
      new Perfume({
        firstContentfulPaint: true,
        firstPaint: true,
        firstInputDelay: true,
        dataConsumption: true,
        browserTracker: true,
      });
    });

    it('should run with config version C', () => {
      new Perfume({
        firstContentfulPaint: true,
        firstPaint: true,
        firstInputDelay: true,
        dataConsumption: true,
        browserTracker: true,
        logging: false,
      });
    });

    it('should run with config version D', () => {
      new Perfume({
        firstContentfulPaint: true,
        firstPaint: true,
        firstInputDelay: true,
        dataConsumption: true,
        browserTracker: true,
        warning: true,
        debugging: true,
      });
    });

    it('should run with config version E', () => {
      new Perfume({
        firstContentfulPaint: true,
        firstPaint: true,
        firstInputDelay: true,
        dataConsumption: true,
        navigationTiming: true,
        warning: true,
        debugging: true,
      });
    });
  });

  describe('.observeFirstInputDelay', () => {
    (window as any).chrome = true;

    beforeEach(() => {
      perfume = new Perfume({
        firstPaint: false,
        firstContentfulPaint: false,
        firstInputDelay: true,
      });
      perfume['observers']['firstInputDelay'] = () => 400;
      perfume['queue'].pushTask = (cb: any) => cb();
    });

    it('should be a promise', () => {
      const promise = perfume.observeFirstInputDelay;
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('.start()', () => {
    beforeEach(() => {
      perfume = new Perfume({ ...mock.defaultPerfumeConfig });
    });

    it('should throw a logWarn if metricName is not passed', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      perfume.start('');
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('Please provide a metric name');
    });

    it('should not throw a logWarn if param is correct', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      perfume.start('metricName');
      expect(spy.mock.calls.length).toEqual(0);
    });

    it('should call perf.mark', () => {
      spy = jest.spyOn((perfume as any).perf, 'mark');
      perfume.start('metricName');
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('metricName', 'start');
    });

    it('should throw a logWarn if recording already started', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      perfume.start('metricName');
      perfume.start('metricName');
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('Recording already started.');
    });
  });

  describe('.end()', () => {
    it('should throw a logWarn if param is not correct', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      perfume.end('');
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('Please provide a metric name');
    });

    it('should throw a logWarn if param is correct and recording already stopped', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      perfume.end('metricName');
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('Recording already stopped.');
    });

    it('should call log() with correct params', () => {
      spy = jest.spyOn(perfume, 'log');
      perfume.config.logging = true;
      perfume.start('metricName');
      perfume.end('metricName');
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith({
        metricName: 'metricName',
        duration: 12346,
      });
    });

    it('should call sendTiming() with correct params', () => {
      spy = jest.spyOn(perfume, 'sendTiming');
      perfume.config.logging = true;
      perfume.start('metricName');
      perfume.end('metricName');
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith({
        metricName: 'metricName',
        duration: 12346,
      });
    });

    it('should add metrics properly', () => {
      perfume = new Perfume();
      perfume.start('metricName');
      expect(perfume['metrics']['metricName']).toBeDefined();
    });

    it('should delete metrics properly', () => {
      perfume = new Perfume();
      perfume.start('metricName');
      perfume.end('metricName');
      expect(perfume['metrics']['metricName']).not.toBeDefined();
    });
  });

  describe('.start() and .end()', () => {
    it('should not throw a logWarn if param is correct', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      perfume.start('metricName');
      perfume.end('metricName');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call perf.mark() twice with the correct arguments', () => {
      spy = jest.spyOn((perfume as any).perf, 'mark');
      perfume.start('metricName');
      perfume.end('metricName');
      expect(spy.mock.calls.length).toEqual(2);
    });

    it('should call perf.measure() with the correct arguments', () => {
      spy = jest.spyOn((perfume as any).perf, 'measure');
      perfume.start('metricName');
      perfume.end('metricName');
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('metricName', {
        end: MockDateNowValue,
        start: MockDateNowValue,
      });
    });
  });

  describe('.endPaint()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should call end() after the first setTimeout', () => {
      spy = jest.spyOn(perfume, 'end');
      perfume.endPaint('test').catch(console.error);
      jest.runAllTimers();
      expect(spy.mock.calls.length).toEqual(1);
    });
  });

  describe('.log()', () => {
    it('should not call window.console.log() if logging is disabled', () => {
      perfume.config.logging = false;
      spy = jest.spyOn(window.console, 'log');
      perfume.log({ metricName: '', duration: 0 });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call window.console.log() if logging is enabled', () => {
      perfume.config.logging = true;
      spy = jest.spyOn(window.console, 'log');
      perfume.log({ metricName: 'metricName', duration: 1235 });
      const text = '%c Perfume.js: metricName 1235.00 ms';
      const style = 'color: #ff6d00;font-size:11px;';
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith(text, style);
    });

    it('should call logWarn if params are not correct', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      perfume.log({ metricName: '', duration: 0 });
      const text = 'Please provide a metric name';
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith(text);
    });

    it('should not call window.console.log() if params are not correct', () => {
      spy = jest.spyOn(window.console, 'log');
      perfume.log({ metricName: '', duration: 0 });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call window.console.log() if params are correct', () => {
      perfume.config.logging = true;
      spy = jest.spyOn(window.console, 'log');
      perfume.log({ metricName: 'metricName', duration: 1245 });
      const text = '%c Perfume.js: metricName 1245.00 ms';
      const style = 'color: #ff6d00;font-size:11px;';
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith(text, style);
    });

    it('should call window.console.log() with data', () => {
      const data = {};
      perfume.config.logging = true;
      spy = jest.spyOn(window.console, 'log');
      perfume.log({ metricName: 'metricName', data });
      const text = '%c Perfume.js: metricName ';
      const style = 'color: #ff6d00;font-size:11px;';
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith(text, style, data);
    });
  });

  describe('.logDebug()', () => {
    it('should not call window.console.log() if debugging is disabled', () => {
      perfume.config.debugging = false;
      spy = jest.spyOn(window.console, 'log');
      perfume.logDebug('', 0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call window.console.log() if debugging is enabled', () => {
      perfume.config.debugging = true;
      spy = jest.spyOn(window.console, 'log');
      perfume.logDebug('metricName', 1235);
      const text = `Perfume.js debugging metricName:`;
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith(text, 1235);
    });
  });

  describe('.sendTiming()', () => {
    it('should not call analyticsTracker() if isHidden is true', () => {
      perfume.config.analyticsTracker = ({ metricName, duration }) => {};
      spy = jest.spyOn(perfume.config, 'analyticsTracker');
      perfume['isHidden'] = true;
      (perfume as any).sendTiming({ metricName: 'metricName', duration: 123 });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call analyticsTracker() if analyticsTracker is defined', () => {
      perfume.config.analyticsTracker = ({ metricName, duration }) => {};
      spy = jest.spyOn(perfume.config, 'analyticsTracker');
      (perfume as any).sendTiming({ metricName: 'metricName', duration: 123 });
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({
        metricName: 'metricName',
        duration: 123,
      });
    });

    it('should call analyticsTracker with the browse Object when browserTracker is true', () => {
      perfume.config.analyticsTracker = ({ metricName, duration }) => {};
      perfume.config.browserTracker = true;
      (perfume as any).browser = {
        name: 'browserName',
        os: 'browserOS',
      };
      spy = jest.spyOn(perfume.config, 'analyticsTracker');
      (perfume as any).sendTiming({ metricName: 'metricName', duration: 123 });
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({
        metricName: 'metricName',
        duration: 123,
        browser: (perfume as any).browser,
      });
    });

    it('should call analyticsTracker with the browse undefined when browserTracker is false', () => {
      perfume.config.analyticsTracker = ({ metricName, duration }) => {};
      perfume.config.browserTracker = false;
      (perfume as any).browser = {
        name: 'browserName',
        os: 'browserOS',
      };
      spy = jest.spyOn(perfume.config, 'analyticsTracker');
      (perfume as any).sendTiming({ metricName: 'metricName', duration: 123 });
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({
        metricName: 'metricName',
        duration: 123,
      });
    });
  });

  describe('.initPerformanceObserver()', () => {
    it('should set observeFirstPaint when firstPaint is true', () => {
      perfume.config.firstPaint = true;
      (perfume as any).initPerformanceObserver();
      expect(perfume.observeFirstPaint).toBeDefined();
    });

    it('should set observeFirstPaint when firstContentfulPaint is true', () => {
      perfume.config.firstContentfulPaint = true;
      (perfume as any).initPerformanceObserver();
      expect(perfume.observeFirstPaint).toBeDefined();
    });

    it('should not set observeFirstPaint when firstPaint or firstContentfulPaint are false', () => {
      perfume.config.firstPaint = false;
      perfume.config.firstContentfulPaint = false;
      (perfume as any).initPerformanceObserver();
      expect(perfume.observeFirstPaint).not.toBeDefined();
    });

    it('should set observeDataConsumption when dataConsumption is true', () => {
      perfume.config.dataConsumption = true;
      (perfume as any).initPerformanceObserver();
      expect(perfume.observeDataConsumption).toBeDefined();
    });

    it('should not set observeDataConsumption when dataConsumption is false', () => {
      perfume.config.dataConsumption = false;
      (perfume as any).initPerformanceObserver();
      expect(perfume.observeDataConsumption).not.toBeDefined();
    });
  });

  describe('.addBrowserToMetricName()', () => {
    it('should return "metricName" when config.browserTracker is false', () => {
      const value = (perfume as any).addBrowserToMetricName('metricName');
      expect(value).toEqual('metricName');
    });

    it('should return "metricName" when config.browserTracker is true and browser.name is undefined', () => {
      perfume.config.browserTracker = true;
      (perfume as any).browser = {};
      const value = (perfume as any).addBrowserToMetricName('metricName');
      expect(value).toEqual('metricName');
    });

    it('should return "metricName.browserName" when browser.name is defined', () => {
      perfume.config.browserTracker = true;
      (perfume as any).browser = {
        name: 'browserName',
      };
      const value = (perfume as any).addBrowserToMetricName('metricName');
      expect(value).toEqual('metricName.browserName');
    });

    it('should return "metricName.browserName.browserOS" when browser.browserOS is defined', () => {
      perfume.config.browserTracker = true;
      (perfume as any).browser = {
        name: 'browserName',
        os: 'browserOS',
      };
      const value = (perfume as any).addBrowserToMetricName('metricName');
      expect(value).toEqual('metricName.browserName.browserOS');
    });
  });

  describe('.checkMetricName()', () => {
    it('should return "true" when provided a metric name', () => {
      const value = (perfume as any).checkMetricName('metricName');
      expect(value).toEqual(true);
    });

    it('should call logWarn when not provided a metric name', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      (perfume as any).checkMetricName();
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('Please provide a metric name');
    });

    it('should return "false" when not provided a metric name', () => {
      const value = (perfume as any).checkMetricName();
      expect(value).toEqual(false);
    });
  });

  describe('.didVisibilityChange()', () => {
    it('should keep "hidden" default value when is false', () => {
      perfume['didVisibilityChange']();
      expect(perfume['isHidden']).toEqual(false);
    });

    it('should set "hidden" value when is true', () => {
      perfume['isHidden'] = false;
      jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      perfume['didVisibilityChange']();
      expect(perfume['isHidden']).toEqual(true);
    });

    it('should keep "hidden" value when changes to false', () => {
      perfume['isHidden'] = true;
      jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
      perfume['didVisibilityChange']();
      expect(perfume['isHidden']).toEqual(true);
    });
  });

  describe('.performanceObserverCb()', () => {
    beforeEach(() => {
      perfume.config.firstPaint = true;
      perfume.config.firstContentfulPaint = true;
      (perfume as any).perfObservers.firstContentfulPaint = {
        disconnect: () => {},
      };
      (perfume as any).perfObservers.firstInputDelay = {
        disconnect: () => {},
      };
    });

    it('should call logMetric() with the correct arguments', () => {
      spy = jest.spyOn(perfume as any, 'logMetric');
      (perfume as any).performanceObserverCb({
        entries: mock.entries,
        entryName: 'first-paint',
        metricLog: 'First Paint',
        metricName: 'firstPaint',
        valueLog: 'startTime',
      });
      (perfume as any).performanceObserverCb({
        entries: mock.entries,
        entryName: 'first-contentful-paint',
        metricLog: 'First Contentful Paint',
        metricName: 'firstContentfulPaint',
        valueLog: 'startTime',
      });
      expect(spy.mock.calls.length).toEqual(2);
      expect(spy).toHaveBeenCalledWith(1, 'First Paint', 'firstPaint');
      expect(spy).toHaveBeenCalledWith(
        1,
        'First Contentful Paint',
        'firstContentfulPaint',
      );
    });

    it('should not call logMetric() when firstPaint and firstContentfulPaint is false', () => {
      perfume.config.firstPaint = false;
      perfume.config.firstContentfulPaint = false;
      spy = jest.spyOn(perfume as any, 'logMetric');
      (perfume as any).performanceObserverCb({
        entries: mock.entries,
        entryName: 'first-paint',
        metricLog: 'First Paint',
        metricName: 'firstPaint',
        valueLog: 'startTime',
      });
      (perfume as any).performanceObserverCb({
        entries: mock.entries,
        entryName: 'first-contentful-paint',
        metricLog: 'First Contentful Paint',
        metricName: 'firstContentfulPaint',
        valueLog: 'startTime',
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call disconnect() for firstInputDelay when metricName is firstInputDelay', () => {
      spy = jest.spyOn(
        (perfume as any).perfObservers.firstInputDelay,
        'disconnect',
      );
      (perfume as any).performanceObserverCb({
        entries: [],
        metricLog: 'First Input Delay',
        metricName: 'firstInputDelay',
        valueLog: 'duration',
      });
      expect(spy.mock.calls.length).toEqual(1);
    });

    it('should not call disconnect() for firstInputDelay when metricName is not firstInputDelay', () => {
      spy = jest.spyOn(
        (perfume as any).perfObservers.firstInputDelay,
        'disconnect',
      );
      (perfume as any).performanceObserverCb({
        entries: [],
        metricLog: 'First Input Delay',
        metricName: 'firstInputDelay',
        valueLog: 'duration',
      });
      expect(spy.mock.calls.length).toEqual(1);
    });
  });

  describe('.performanceObserverResourceCb()', () => {
    beforeEach(() => {
      perfume.config.dataConsumption = true;
      (perfume as any).perfObservers.dataConsumption = { disconnect: () => {} };
    });

    it('should dataConsumption be 0 when entries are empty', () => {
      (perfume as any).performanceObserverResourceCb({
        entries: [],
      });
      expect(perfume.dataConsumption).toEqual(0);
    });

    it('should float the dataConsumption result', () => {
      perfume.dataConsumption = 0;
      (perfume as any).performanceObserverResourceCb({
        entries: [
          {
            decodedBodySize: 12345,
          },
        ],
      });
      expect(perfume.dataConsumption).toEqual(12.35);
    });

    it('should sum the dataConsumption result', () => {
      perfume.dataConsumption = 0;
      (perfume as any).performanceObserverResourceCb({
        entries: [
          {
            decodedBodySize: 12345,
          },
          {
            decodedBodySize: 10000,
          },
        ],
      });
      expect(perfume.dataConsumption).toEqual(22.35);
    });
  });

  describe('.digestFirstPaintEntries()', () => {
    it('should call performanceObserver()', () => {
      spy = jest.spyOn(perfume as any, 'performanceObserverCb');
      perfume['digestFirstPaintEntries']([]);
      expect(spy.mock.calls.length).toEqual(2);
      expect(spy).toHaveBeenCalledWith({
        entries: [],
        entryName: 'first-paint',
        metricLog: 'First Paint',
        metricName: 'firstPaint',
        valueLog: 'startTime',
      });
      expect(spy).toHaveBeenCalledWith({
        entries: [],
        entryName: 'first-contentful-paint',
        metricLog: 'First Contentful Paint',
        metricName: 'firstContentfulPaint',
        valueLog: 'startTime',
      });
    });
  });

  describe('.initFirstPaint()', () => {
    beforeEach(() => {
      perfume.config.firstPaint = true;
      perfume.config.firstContentfulPaint = true;
    });

    it('should call performanceObserver()', () => {
      spy = jest.spyOn(perfume['perf'], 'performanceObserver');
      (window as any).chrome = true;
      (window as any).PerformanceObserver = mock.PerformanceObserver;
      perfume['initFirstPaint']();
      expect(spy.mock.calls.length).toEqual(1);
    });

    it('should throw a logWarn if fails', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      (window as any).chrome = true;
      mock.PerformanceObserver.simulateErrorOnObserve = true;
      (window as any).PerformanceObserver = mock.PerformanceObserver;
      perfume['initFirstPaint']();
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('initFirstPaint failed');
    });
  });

  describe('.digestFirstInputDelayEntries()', () => {
    it('should call performanceObserver()', () => {
      spy = jest.spyOn(perfume as any, 'performanceObserverCb');
      perfume['digestFirstInputDelayEntries']([]);
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith({
        entries: [],
        metricLog: 'First Input Delay',
        metricName: 'firstInputDelay',
        valueLog: 'duration',
      });
    });

    it('should call disconnectDataConsumption()', () => {
      spy = jest.spyOn(perfume as any, 'disconnectDataConsumption');
      perfume['digestFirstInputDelayEntries']([]);
      expect(spy.mock.calls.length).toEqual(1);
    });
  });

  describe('.initFirstInputDelay()', () => {
    beforeEach(() => {
      perfume.config.firstInputDelay = true;
    });

    it('should call performanceObserver()', () => {
      spy = jest.spyOn(perfume['perf'], 'performanceObserver');
      (window as any).chrome = true;
      (window as any).PerformanceObserver = mock.PerformanceObserver;
      perfume['initFirstInputDelay']();
      expect(spy.mock.calls.length).toEqual(1);
    });

    it('should throw a logWarn if fails', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      (window as any).chrome = true;
      mock.PerformanceObserver.simulateErrorOnObserve = true;
      (window as any).PerformanceObserver = mock.PerformanceObserver;
      perfume['initFirstInputDelay']();
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('initFirstInputDelay failed');
    });
  });

  describe('.disconnectDataConsumption()', () => {
    beforeEach(() => {
      perfume.dataConsumption = 10;
      (perfume as any).perfObservers.dataConsumption = { disconnect: () => {} };
    });

    it('should call logMetric() with the correct arguments', () => {
      spy = jest.spyOn(perfume as any, 'logMetric');
      (perfume as any).disconnectDataConsumption();
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith(
        perfume.dataConsumption,
        'Data Consumption',
        'dataConsumption',
        'Kb',
      );
    });

    it('should call disconnect()', () => {
      spy = jest.spyOn(
        (perfume as any).perfObservers.dataConsumption,
        'disconnect',
      );
      (perfume as any).disconnectDataConsumption();
      expect(spy.mock.calls.length).toEqual(1);
    });
  });

  describe('.initDataConsumption()', () => {
    beforeEach(() => {
      perfume.config.dataConsumption = true;
      (perfume as any).perfObservers.dataConsumption = { disconnect: () => {} };
    });

    it('should call performanceObserver()', () => {
      spy = jest.spyOn(perfume['perf'], 'performanceObserver');
      (window as any).chrome = true;
      (window as any).PerformanceObserver = mock.PerformanceObserver;
      perfume['initDataConsumption']();
      expect(spy.mock.calls.length).toEqual(1);
    });

    it('should call disconnectDataConsumption() after the setTimeout', () => {
      jest.spyOn(perfume['perf'], 'performanceObserver');
      spy = jest.spyOn(perfume as any, 'disconnectDataConsumption');
      (window as any).chrome = true;
      (window as any).PerformanceObserver = mock.PerformanceObserver;
      perfume['initDataConsumption']();
      jest.runAllTimers();
      expect(spy.mock.calls.length).toEqual(1);
    });

    it('should throw a logWarn if fails', () => {
      spy = jest.spyOn(perfume as any, 'logWarn');
      (window as any).chrome = true;
      mock.PerformanceObserver.simulateErrorOnObserve = true;
      (window as any).PerformanceObserver = mock.PerformanceObserver;
      perfume['initDataConsumption']();
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith('initDataConsumption failed');
    });
  });

  describe('.onVisibilityChange()', () => {
    it('should not call document.addEventListener() when document.hidden is undefined', () => {
      spy = jest.spyOn(document, 'addEventListener');
      jest.spyOn(document, 'hidden', 'get').mockReturnValue(undefined as any);
      (perfume as any).onVisibilityChange();
      expect(spy.mock.calls.length).toEqual(0);
    });

    it('should call document.addEventListener() with the correct argument', () => {
      spy = jest.spyOn(document, 'addEventListener');
      jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      (perfume as any).onVisibilityChange();
      expect(spy.mock.calls.length).toEqual(1);
      expect(document.addEventListener).toHaveBeenLastCalledWith(
        'visibilitychange',
        perfume['didVisibilityChange'],
      );
    });
  });

  describe('.logMetric()', () => {
    it('should call log() with the correct arguments', () => {
      spy = jest.spyOn(perfume, 'log');
      (perfume as any).logMetric(
        1,
        'First Contentful Paint',
        'firstContentfulPaint',
      );
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith({
        metricName: 'First Contentful Paint',
        duration: perfume.firstContentfulPaintDuration,
        suffix: 'ms',
      });
    });

    it('should call sendTiming() with the correct arguments', () => {
      spy = jest.spyOn(perfume as any, 'sendTiming');
      (perfume as any).logMetric(
        1,
        'First Contentful Paint',
        'firstContentfulPaint',
      );
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith({
        metricName: 'firstContentfulPaint',
        duration: perfume.firstContentfulPaintDuration,
      });
    });

    it('should not call sendTiming() when duration is higher of config.maxMeasureTime', () => {
      spy = jest.spyOn(perfume as any, 'sendTiming');
      (perfume as any).logMetric(
        20000,
        'First Contentful Paint',
        'firstContentfulPaint',
      );
      expect(spy.mock.calls.length).toEqual(0);
    });

    it('should not call sendTiming() when dataConsumption is higher of config.maxDataConsumption', () => {
      spy = jest.spyOn(perfume as any, 'sendTiming');
      (perfume as any).logMetric(25000, 'Data Consumption', 'dataConsumption');
      expect(spy.mock.calls.length).toEqual(0);
    });

    it('should perfume.firstContentfulPaintDuration be equal to duration', () => {
      (perfume as any).logMetric(
        1,
        'First Contentful Paint',
        'firstContentfulPaint',
      );
      expect(perfume.firstContentfulPaintDuration).toEqual(1);
    });

    it('should perfume.firstInputDelayDuration be equal to duration', () => {
      (perfume as any).logMetric(2, 'First Input Delay', 'firstInputDelay');
      expect(perfume.firstInputDelayDuration).toEqual(2);
    });
  });

  describe('.logNavigationTiming()', () => {
    it('should call log() with the correct arguments', () => {
      spy = jest.spyOn(perfume, 'log');
      (perfume as any).logNavigationTiming();
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith({
        metricName: 'NavigationTiming',
        data: {},
        suffix: '',
      });
    });

    it('should call sendTiming() with the correct arguments', () => {
      spy = jest.spyOn(perfume, 'sendTiming');
      (perfume as any).logNavigationTiming();
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith({
        metricName: 'NavigationTiming',
        data: {},
      });
    });
  });

  describe('.logWarn()', () => {
    it('should throw a console.warn if config.warning is true', () => {
      spy = jest.spyOn(window.console, 'warn');
      perfume.config.warning = true;
      (perfume as any).logWarn('message');
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith(perfume.config.logPrefix, 'message');
    });

    it('should not throw a console.warn if config.warning is false', () => {
      spy = jest.spyOn(window.console, 'warn');
      perfume.config.warning = false;
      (perfume as any).logWarn('message');
      expect(spy.mock.calls.length).toEqual(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw a console.warn if config.logging is false', () => {
      spy = jest.spyOn(window.console, 'warn');
      perfume.config.warning = true;
      perfume.config.logging = false;
      (perfume as any).logWarn('message');
      expect(spy.mock.calls.length).toEqual(0);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
