import { Injectable } from '@nestjs/common';
import { BaPriApiService } from '../ex-api/ba/ba-pri-api.service';
import { OePriApiService } from '../ex-api/oe/oe-pri-api.service';
import { HbPriApiService } from '../ex-api/hb/hb-pri-api.service';
import { CancelOrderForm, OrderForm } from '../ex-api/order-form';
import { API } from '../../models/sys/exapi';
import { Exch } from '../../models/sys/exch';
import { roundNumber, toFixedDown } from '../../common/utils';
import { BaPubApiService } from '../ex-api/ba/ba-pub-api.service';
import { HbPubSyncService } from './hb/hb-pub-sync.service';
import { OePubApiService } from '../ex-api/oe/oe-pub-api.service';


type BaExchangeInfo = {
  symbols: {
    filters: {
      filterType: string
    }[]
  }[]
}

@Injectable()
export class ExPlaceOrderService {

  constructor(private baPriService: BaPriApiService,
              private oePriService: OePriApiService,
              private hbPriService: HbPriApiService,
              private baPubApiService: BaPubApiService,
              private oePubApiService: OePubApiService,
              private hbPubSyncService: HbPubSyncService) {

  }

  private detectFractionDigits(stepSize: string): number {
    if (/^[^0]\./.test(stepSize)) { // 1.00000000
      return 0;
    }
    // 0.00010000
    stepSize = stepSize.substr(2);
    const oi = stepSize.indexOf('1');
    if (oi >= 0) {
      return oi + 1;
    }
    return -1;
  }

  async placeOrder(api: API,
                   ex: string,
                   form: OrderForm): Promise<any> {
    if (!api) {
      throw new Error(`API未配置（${ex}）`);
    }

    let fractionDigits = 2;
    const quantityByQuote = !!form.quoteQuantity;

    try {
      if (ex === Exch.CODE_BA) {
        const symbolInfo: BaExchangeInfo = await this.baPubApiService.exchangeInfo(form.symbol);
        if (symbolInfo.symbols && symbolInfo.symbols.length > 0) {
          const params = symbolInfo.symbols[0];
          const filters: any[] = params.filters;
          const filterType = quantityByQuote ? 'MARKET_LOT_SIZE' : 'LOT_SIZE';
          const filterLotSize = filters.find(f => f.filterType === filterType);
          if (filterLotSize) {
            const stepSize = filterLotSize.stepSize;
            const fd = this.detectFractionDigits(stepSize);
            if (fd >= 0) {
              fractionDigits = fd;
            }
          }
        }
      } else if (ex === Exch.CODE_OE) {
        if (!quantityByQuote) {
          let symbolInfo = await this.oePubApiService.instruments(form.symbol);
          if (symbolInfo && symbolInfo.length === 1) {
            symbolInfo = symbolInfo[0];
            const lotSz = symbolInfo.lotSz;
            const fd = this.detectFractionDigits(lotSz);
            if (fd >= 0) {
              fractionDigits = fd;
            }
          }
        }
      } else if (ex === Exch.CODE_HB) {
        if (!quantityByQuote) {
          const symbolInfo = await this.hbPubSyncService.getSymbolInfo(form.symbol);
          if (symbolInfo) {
            const ap: number = symbolInfo['amount-precision'];
            if (typeof ap === 'number') {
              fractionDigits = ap;
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (quantityByQuote) {
      form.quoteQuantity = +toFixedDown(form.quoteQuantity, fractionDigits);
    } else {
      form.quantity = +toFixedDown(form.quantity, fractionDigits);
    }
    if (form.price) {
      form.price = +roundNumber(form.price);
    }
    let value;
    if (ex === Exch.CODE_BA) {
      value = await this.baPriService.placeOrder(api, form);
    } else if (ex === Exch.CODE_OE) {
      value = await this.oePriService.placeOrder(api, form);
    } else if (ex === Exch.CODE_HB) {
      value = await this.hbPriService.placeOrder(api, form);
    } else {
      throw new Error('未知交易所：' + ex);
    }
    return value;
  }

  async cancelOrder(api: API,
                    ex: string,
                    form: CancelOrderForm): Promise<any> {
    if (!api) {
      throw new Error(`API未配置（${ex}）`);
    }
    let value;
    if (ex === Exch.CODE_BA) {
      value = await this.baPriService.cancelOrder(api, form);
    } else if (ex === Exch.CODE_OE) {
      value = await this.oePriService.cancelOrder(api, form);
    } else if (ex === Exch.CODE_HB) {
      value = await this.hbPriService.cancelOrder(api, form);
    } else {
      throw new Error('未知交易所：' + ex);
    }
    return value;
  }

}
