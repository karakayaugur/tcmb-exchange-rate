'use strict';

const request = require('request-promise');
const Promise = require("bluebird");
const xml2js = Promise.promisifyAll(require("xml2js")).Parser(
    {
        attrkey: '$',
        tagNameProcessors: [_pretty],
        attrNameProcessors: [_pretty],
        valueProcessors: [_processors],
        trim: true,
        explicitArray: false,
        emptyTag: null
    }
);

const TcbmHelper = function () {
    this.listOptions = {
        uri: 'http://www.tcmb.gov.tr/kurlar/today.xml',
        encoding: 'UTF-8'
    };
};

TcbmHelper.prototype.getList = function () {
    return new Promise((resolve, reject) => {
        request(this.listOptions)
            .then(_parse)
            .then(_populate)
            .then(resolve)
            .catch(reject);
    });
};

TcbmHelper.prototype.getByCode = function (currencyCode = 'USD') {
    return new Promise((resolve, reject) => {
        let _currencyCode = currencyCode.toUpperCase();
        this.getList()
            .then(res => {
                resolve(res.find((item) => {
                    return item.currencyCode == _currencyCode;
                }))
            })
            .catch(reject);
    });
};

TcbmHelper.prototype.getByCodes = function (currencyCodes = ['USD', 'EUR']) {
    return new Promise((resolve, reject) => {
        let _currencyCodes = currencyCodes.map(item => item.toUpperCase());
        this.getList()
            .then(response => {
                resolve(response.filter(item => _currencyCodes.includes(item.currencyCode)));
            })
            .catch(reject);
    });
}

/*Private*/
function _parse(xml) {
    return new Promise((resolve, reject) => {
        xml2js.parseStringAsync(xml)
            .then(resolve)
            .catch(reject)
    });
}

function _lowerFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

function _pretty(name) {
    return _lowerFirstLetter(name).replace(/[-_]+(.)?/g, function (g) { return g[1].toUpperCase(); });
}

function _processors(val) {
    if (val) {
        let floatVal = parseFloat(val);
        if (isNaN(floatVal))
            return val;
        return parseFloat(val);
    }
}

function _populate(parameter) {
    return new Promise((resolve, reject) => {
        try {
            if (parameter.tarihDate.currency) {
                let result = parameter.tarihDate.currency.map((item) => {
                    return {
                        "date": parameter.tarihDate.$.date,
                        "currencyCode": item.$.currencyCode,
                        "currencyName": item.currencyName,
                        "banknoteBuying": item.banknoteBuying,
                        "banknoteSelling": item.banknoteSelling,
                        "currencyName": item.currencyName,
                        "forexBuying": item.forexBuying,
                        "forexSelling": item.forexSelling
                    }
                })
                resolve(result);
            }
            else {
                throw new Error('Currency list is not exist');
            }
        } catch (err) {
            reject(err);
        }
    })
}
/*Private*/

module.exports = TcbmHelper;