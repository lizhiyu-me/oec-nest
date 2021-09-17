import { Column, Entity } from 'typeorm';
import { Model } from '../model';

@Entity()
export class Strategy extends Model {
  static TypeLB = 'LB';
  static TypeHS = 'HS';
  static TypeLS = 'LS';
  static TypeHB = 'HB';

  @Column()
  ex: string;
  @Column()
  symbol: string;
  @Column()
  baseCcy: string;
  @Column()
  quoteCcy: string;
  @Column()
  type: string; // LB 低买, HS 高卖, LS 低卖（止损）, HB 高买（跟涨）
  @Column()
  side: 'buy' | 'sell';
  @Column()
  watchDirection: 'up' | 'down';
  @Column({nullable: true})
  applyOrder: number;

  @Column({type: 'double', nullable: true})
  basePoint: number;

  @Column({type: 'double', nullable: true})
  expectingPercent: number;
  @Column({type: 'double', nullable: true})
  expectingPoint: number;

  @Column({type: 'double', nullable: true})
  drawbackPercent: number;
  @Column({type: 'double', nullable: true})
  tradingPoint: number;

  @Column({type: 'double', nullable: true})
  intenseWatchPercent: number;
  @Column({type: 'double', nullable: true})
  mediumWatchPercent: number;

  @Column({type: 'double', nullable: true})
  tradeVol: number; // base for sell, quote for buy
  @Column({type: 'double', nullable: true})
  tradeVolPercent: number; // base for sell, quote for buy
  @Column()
  tradeVolByValue: boolean;

  @Column({type: 'double', nullable: true})
  peak: number;
  @Column({nullable: true})
  peakTime: Date;

  @Column({type: 'double', nullable: true})
  valley: number;
  @Column({nullable: true})
  valleyTime: Date;

  @Column({nullable: true})
  beyondExpect: boolean;

  @Column({nullable: true})
  firstCheckAt: Date;
  @Column({nullable: true})
  lastCheckAt: Date;
  @Column({type: 'double', nullable: true})
  lastCheckPrice: number;

  @Column({nullable: true})
  orderPlacedAt: Date;
  @Column({nullable: true})
  clientOrderId: string;

  @Column({nullable: true})
  completedAt: Date;

  @Column()
  watchLevel: 'loose' | 'medium' | 'intense';
  @Column()
  status: 'initial' | 'started' | 'paused' | 'placed' | 'completed';
}

export interface StrategyFilter {
  type?: string;
  ex?: string;
  side?: string;
  status?: string;
}
