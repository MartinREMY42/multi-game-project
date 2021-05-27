import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AbstractGameComponent }
    from 'src/app/components/game-components/abstract-game-component/AbstractGameComponent';
import { Coord } from 'src/app/jscaip/Coord';
import { Vector } from 'src/app/jscaip/Direction';
import { Encoder } from 'src/app/jscaip/Encoder';
import { Player } from 'src/app/jscaip/Player';
import { GameStatus } from 'src/app/jscaip/Rules';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { PentagoLegalityStatus } from './PentagoLegalityStatus';
import { PentagoMinimax } from './PentagoMinimax';
import { PentagoMove } from './PentagoMove';
import { PentagoRules } from './PentagoRules';
import { PentagoState } from './PentagoState';

@Component({
    selector: 'app-pentago',
    templateUrl: './Pentago.component.html',
    styleUrls: ['../../components/game-components/abstract-game-component/abstract-game-component.css'],
})
export class PentagoComponent extends AbstractGameComponent<PentagoMove,
                                                            PentagoState,
                                                            PentagoLegalityStatus>
{

    public rules: PentagoRules = new PentagoRules(PentagoState);

    public encoder: Encoder<PentagoMove>;

    public readonly BLOCK_WIDTH: number;
    public readonly BLOCK_SEPARATION: number;
    public readonly DIAGONAL_BAR_OFFSET: number;

    public arrows: [string, number, boolean][] = [];
    public victoryCoords: Coord[] = [];
    public canSkipRotation: boolean;
    public currentDrop: Coord;

    public movedBlock: number;
    public lastDrop: Coord;

    constructor(snackBar: MatSnackBar) {
        super(snackBar);
        this.updateBoard();
        this.availableMinimaxes = [
            new PentagoMinimax('PentagoMinimax'),
        ];
        this.BLOCK_WIDTH = (3 * this.CASE_SIZE) + (2 * this.STROKE_WIDTH);
        this.BLOCK_SEPARATION = (this.BLOCK_WIDTH + 2 * this.STROKE_WIDTH);
        this.DIAGONAL_BAR_OFFSET = Math.cos(Math.PI / 4) * 0.75 * this.CASE_SIZE;
    }
    public updateBoard(): void {
        this.board = this.rules.node.gamePartSlice.getCopiedBoard();
        this.victoryCoords = this.rules.getVictoryCoords(this.rules.node.gamePartSlice);
        const lastMove: PentagoMove = this.rules.node.move;
        if (lastMove) {
            this.movedBlock = lastMove.blockTurned.getOrNull();
            const localCoord: Coord = new Coord(lastMove.coord.x % 3 - 1, lastMove.coord.y % 3 - 1);
            if (lastMove.blockTurned.isPresent() &&
                localCoord.equals(new Coord(0, 0)) === false &&
                this.coordBelongToBlock(lastMove))
            {
                let postRotation: Coord;
                if (lastMove.turnedClockwise) {
                    postRotation = PentagoState.ROTATION_MAP.find((value: [Coord, Coord]) => {
                        return value[0].equals(localCoord);
                    })[1];
                } else {
                    postRotation = PentagoState.ROTATION_MAP.find((value: [Coord, Coord]) => {
                        return value[1].equals(localCoord);
                    })[0];
                }
                const b: number = lastMove.blockTurned.get();
                const bx: number = b % 2 === 0 ? 1 : 4;
                const by: number = b < 2 ? 1 : 4;
                postRotation = postRotation.getNext(new Vector(bx, by), 1);
                this.lastDrop = postRotation;
            } else {
                this.lastDrop = lastMove.coord;
            }
        } else {
            this.hidePreviousMove();
        }
    }
    private coordBelongToBlock(lastMove: PentagoMove): boolean {
        const lastMoveBlockY: number = lastMove.coord.y < 3 ? 0 : 1;
        const lastMoveBlockX: number = lastMove.coord.x < 3 ? 0 : 1;
        const lastMoveBlockIndex: number = lastMoveBlockY * 2 + lastMoveBlockX;
        return lastMoveBlockIndex === lastMove.blockTurned.getOrNull();
    }
    public hidePreviousMove(): void {
        this.lastDrop = null;
        this.movedBlock = null;
    }
    public cancelMoveAttempt(): void {
        this.arrows = [];
        this.currentDrop = null;
        this.victoryCoords = null;
        this.canSkipRotation = false;
        this.lastDrop = null;
    }
    public async onClick(x: number, y: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#click_' + x + '_' + y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        const drop: PentagoMove = PentagoMove.rotationless(x, y);
        const state: PentagoState = this.rules.node.gamePartSlice;
        const postDropState: PentagoState = state.applyLegalDrop(drop);
        if (postDropState.neutralBlocks.length === 4) {
            return this.chooseMove(drop, state, null, null);
        }
        const gameStatus: GameStatus = this.rules.getGameStatus(this.rules.node);
        this.canSkipRotation = postDropState.neutralBlocks.length > 0 && gameStatus.isEndGame === false;
        this.currentDrop = new Coord(x, y);
        this.displayArrows(postDropState.neutralBlocks);
    }
    public getCenter(xOrY: number): number {
        const block: number = xOrY < 3 ? 0 : this.BLOCK_SEPARATION;
        return block + (2 * this.STROKE_WIDTH) + (((xOrY % 3) + 0.5) * this.CASE_SIZE);
    }
    public displayArrows(neutralBlocks: number[]): void {
        this.arrows = [];
        for (let blockIndex: number = 0; blockIndex < 4; blockIndex++) {
            if (neutralBlocks.includes(blockIndex) === false) {
                const bx: number = blockIndex % 2;
                const by: number = blockIndex < 2 ? 0 : 1;
                const localOffset: number = (2 * this.STROKE_WIDTH) + (0.5 * this.CASE_SIZE);
                const anticlockwiseX: number = bx * this.BLOCK_SEPARATION + localOffset;
                const anticlockwiseY: number = by * this.BLOCK_SEPARATION + localOffset;
                let arrowPath: string =
                    'M ' +
                    (anticlockwiseX + (0.75 * this.CASE_SIZE)) + ' ' +
                    (anticlockwiseY - (0.25 * this.CASE_SIZE)) +
                    ' q ' +
                    (- this.CASE_SIZE) + ' ' +
                    '0 ' +
                    (- this.CASE_SIZE) + ' ' +
                    this.CASE_SIZE;
                this.arrows.push([arrowPath, blockIndex, false]);
                arrowPath =
                    'M ' +
                    (anticlockwiseX + (1.25 * this.CASE_SIZE)) + ' ' +
                    (anticlockwiseY - (0.25 * this.CASE_SIZE)) +
                    ' q ' +
                    this.CASE_SIZE + ' ' +
                    '0 ' +
                    this.CASE_SIZE + ' ' +
                    this.CASE_SIZE;
                this.arrows.push([arrowPath, blockIndex, true]);
            }
        }
    }
    public getBlockClasses(x: number, y: number): string[] {
        const blockIndex: number = x + 2 * y;
        if (blockIndex === this.movedBlock) {
            return ['moved'];
        }
    }
    public getCaseClasses(x: number, y: number): string[] {
        const classes: string[] = [];
        const player: string = this.getPlayerClass(Player.of(this.board[y][x]));
        classes.push(player);
        if (new Coord(x, y).equals(this.lastDrop)) {
            classes.push('lastmove');
        }
        return classes;
    }
    public async rotate(arrow: [string, number, boolean]): Promise<MGPValidation> {
        const clockwise: string = arrow[2] ? 'clockwise' : 'anticlockwise';
        const clickValidity: MGPValidation = this.canUserPlay('#rotate_' + arrow[1] + '_' + clockwise);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        const move: PentagoMove = PentagoMove.withRotation(this.currentDrop.x, this.currentDrop.y, arrow[1], arrow[2]);
        return this.chooseMove(move, this.rules.node.gamePartSlice, null, null);
    }
    public async skipRotation(): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#skipRotation');
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        const drop: PentagoMove = PentagoMove.rotationless(this.currentDrop.x, this.currentDrop.y);
        return this.chooseMove(drop, this.rules.node.gamePartSlice, null, null);
    }
}