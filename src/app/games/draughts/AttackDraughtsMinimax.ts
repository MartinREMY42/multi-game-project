import { Coord } from 'src/app/jscaip/Coord';
import { Direction } from 'src/app/jscaip/Direction';
import { NodeUnheritance } from 'src/app/jscaip/NodeUnheritance';
import { Player } from 'src/app/jscaip/Player';
import { GameStatus } from 'src/app/jscaip/Rules';
import { DraughtsMinimax } from './DraughtsMinimax';
import { DraughtsState } from './DraughtsState';
import { DraughtsNode } from './DraughtsRules';

export class AttackDraughtsMinimax extends DraughtsMinimax {
    private readonly DOMINANCE_FACTOR: number = 20;
    private readonly DEFENSE_FACTOR: number = 5;
    private readonly TERRITORY_FACTOR: number = 2;
    private readonly OFFENSE_FACTOR: number = 10;
    private readonly CENTER_FACTOR: number = 5;
    private readonly MOBILITY_FACTOR: number = 0.12;
    public getDominance(state: DraughtsState): number {
        let score: number = 0;
        for (let y: number = 0; y < 12; y++) {
            for (let x: number = 0; x < 14; x++) {
                const owner: Player = state.getPieceAt(new Coord(x, y));
                if (owner !== Player.NONE) {
                    score += owner.getScoreModifier();
                }
            }
        }
        return score * this.DOMINANCE_FACTOR;
    }
    public getDefense(state: DraughtsState): number {
        let score: number = 0;
        for (let x: number = 0; x < 14; x++) {
            if (state.getPieceAt(new Coord(x, 11)) === Player.ZERO) {
                score += Player.ZERO.getScoreModifier();
            }
            if (state.getPieceAt(new Coord(x, 0)) === Player.ONE) {
                score += Player.ONE.getScoreModifier();
            }
        }
        return score * this.DEFENSE_FACTOR;
    }
    public getTerritory(state: DraughtsState): number {
        let score: number = 0;
        for (let y: number = 0; y < 12; y++) {
            for (let x: number = 0; x < 14; x++) {
                const owner: Player = state.getPieceAt(new Coord(x, y));
                if (owner !== Player.NONE) {
                    for (let dx: number = -1; dx <= 1; dx++) {
                        for (let dy: number = -1; dy <= 1; dy++) {
                            const coord: Coord = new Coord(x+dx, y+dy);
                            if (coord.isInRange(14, 12)) {
                                const neighbour: Player = state.getPieceAt(coord);
                                if (neighbour === owner) {
                                    score += 1 * owner.getScoreModifier();
                                } else if (neighbour === Player.NONE) {
                                    score += 1 * owner.getScoreModifier();
                                }
                            }
                        }
                    }
                    score -= owner.getScoreModifier();
                }
            }
        }
        return score * this.TERRITORY_FACTOR;
    }
    public getOffense(state: DraughtsState): number {
        let score: number = 0;
        for (let x: number = 0; x < 14; x++) {
            if (state.getPieceAt(new Coord(x, 0)) === Player.ZERO) {
                score += Player.ZERO.getScoreModifier();
            }
            if (state.getPieceAt(new Coord(x, 11)) === Player.ONE) {
                score += Player.ONE.getScoreModifier();
            }
        }
        return score * this.OFFENSE_FACTOR;
    }
    public getCenter(state: DraughtsState): number {
        let score: number = 0;
        for (let y: number = 0; y < 12; y++) {
            for (let x: number = 0; x < 14; x++) {
                const owner: Player = state.getPieceAt(new Coord(x, y));
                if (owner !== Player.NONE) {
                    score += owner.getScoreModifier()*(Math.sqrt((x - 6.5)*(x - 6.5)));
                }
            }
        }
        return score * this.CENTER_FACTOR;
    }
    public getMobility(state: DraughtsState): number {
        let score: number = 0;
        let biggestZero: number = 0;
        let biggestOne: number = 0;
        for (let y: number = 0; y < 12; y++) {
            for (let x: number = 0; x < 14; x++) {
                const firstCoord: Coord = new Coord(x, y);
                const owner: Player = state.getPieceAt(firstCoord);
                if (owner !== Player.NONE) {
                    for (const direction of Direction.DIRECTIONS) {
                        let movedPieces: number = 1;
                        let nextCoord: Coord = firstCoord.getNext(direction, 1);
                        while (nextCoord.isInRange(14, 12) &&
                            state.getPieceAt(nextCoord) === owner) {
                            movedPieces += 1;
                            nextCoord = nextCoord.getNext(direction, 1);
                        }
                        let stepSize: number = 1;
                        while (nextCoord.isInRange(14, 12) &&
                               stepSize <= movedPieces &&
                               state.getPieceAt(nextCoord) === Player.NONE)
                        {
                            stepSize++;
                            nextCoord = nextCoord.getNext(direction, 1);
                        }
                        score += (stepSize*stepSize) * owner.getScoreModifier();
                        if (owner === Player.ZERO) {
                            biggestZero = Math.max(biggestZero, stepSize);
                        } else if (owner === Player.ONE) {
                            biggestOne = Math.max(biggestOne, stepSize);
                        }
                    }
                }
            }
        }
        return (score +
            biggestZero * Player.ZERO.getScoreModifier() +
            biggestOne * Player.ONE.getScoreModifier()) * this.MOBILITY_FACTOR;
    }

    public getBoardValue(node: DraughtsNode): NodeUnheritance {
        const state: DraughtsState = node.gameState;
        const gameStatus: GameStatus = this.ruler.getGameStatus(node);
        if (gameStatus.isEndGame) {
            return new NodeUnheritance(gameStatus.toBoardValue());
        }
        const dominance: number = this.getDominance(state);
        const defense: number = this.getDefense(state);
        const territory: number = this.getTerritory(state);
        const center: number = this.getCenter(state);
        const winning: number = this.getOffense(state);
        const mobility: number = this.getMobility(state);
        return new NodeUnheritance(dominance + defense + territory + center + winning + mobility);
    }
}
