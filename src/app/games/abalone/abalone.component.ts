import { Component } from '@angular/core';
import { HexagonalGameComponent } from 'src/app/components/game-components/abstract-game-component/HexagonalGameComponent';
import { Coord } from 'src/app/jscaip/Coord';
import { Direction } from 'src/app/jscaip/Direction';
import { MoveEncoder } from 'src/app/jscaip/Encoder';
import { FourStatePiece } from 'src/app/jscaip/FourStatePiece';
import { HexaDirection } from 'src/app/jscaip/HexaDirection';
import { HexaLayout } from 'src/app/jscaip/HexaLayout';
import { PointyHexaOrientation } from 'src/app/jscaip/HexaOrientation';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { Player } from 'src/app/jscaip/Player';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';
import { MessageDisplayer } from 'src/app/services/message-displayer/MessageDisplayer';
import { ArrayUtils } from 'src/app/utils/ArrayUtils';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { AbaloneDummyMinimax } from './AbaloneDummyMinimax';
import { AbaloneFailure } from './AbaloneFailure';
import { AbaloneGameState } from './AbaloneGameState';
import { AbaloneMove } from './AbaloneMove';
import { AbaloneLegalityStatus, AbaloneRules } from './AbaloneRules';

export class HexaDirArrow {
    public constructor(public startCenter: Coord,
                       public landingCenter: Coord,
                       public landing: Coord,
                       public dir: HexaDirection) {}
}

@Component({
    selector: 'app-abalone',
    templateUrl: './abalone.component.html',
    styleUrls: ['../../components/game-components/abstract-game-component/abstract-game-component.css'],
})
export class AbaloneComponent extends HexagonalGameComponent<AbaloneMove, AbaloneGameState, AbaloneLegalityStatus> {

    public hexaLayout: HexaLayout;

    public encoder: MoveEncoder<AbaloneMove> = AbaloneMove.encoder;

    public moveds: Coord[] = [];

    public directions: HexaDirArrow[] = [];

    public selecteds: Coord[] = [];

    public scores: [number, number] = [0, 0];

    constructor(messageDisplayer: MessageDisplayer) {
        super(messageDisplayer);
        this.rules = new AbaloneRules(AbaloneGameState);
        this.availableMinimaxes = [
            new AbaloneDummyMinimax(this.rules, 'Dummy'),
        ];
        this.showScore = true;
        this.hexaLayout = new HexaLayout(this.PIECE_SIZE,
                                         new Coord(- 8 * this.PIECE_SIZE, 2 * this.PIECE_SIZE),
                                         PointyHexaOrientation.INSTANCE);
        this.updateBoard();
    }
    public updateBoard(): void {
        this.cancelMoveAttempt();
        this.hidePreviousMove();
        if (this.rules.node.move != null) {
            this.showPreviousMove();
        }
        this.board = this.rules.node.gamePartSlice.getCopiedBoard();
        this.scores = this.rules.node.gamePartSlice.getScores();
    }
    private hidePreviousMove(): void {
        this.moveds = [];
    }
    public cancelMoveAttempt(): void {
        this.directions = [];
        this.selecteds = [];
    }
    private showPreviousMove(): void {
        const move: AbaloneMove = this.rules.node.move;
        if (move.isSingleCoord()) {
            this.showPushingMove(move);
        } else {
            this.showSideStepMove(move);
        }
    }
    private showPushingMove(move: AbaloneMove): void {
        const previousState: AbaloneGameState = this.rules.node.mother.gamePartSlice;
        let moved: Coord = move.coord;
        this.moveds = [moved];
        moved = moved.getNext(move.dir);
        while (moved.isInRange(9, 9) && previousState.isPiece(moved)) {
            this.moveds.push(moved);
            moved = moved.getNext(move.dir);
        }
        if (moved.isInRange(9, 9)) {
            this.moveds.push(moved);
        }
    }
    private showSideStepMove(move: AbaloneMove): void {
        let last: Coord = move.lastPiece.get();
        const alignement: HexaDirection = move.coord.getDirectionToward(last);
        last = last.getNext(alignement);
        let processed: Coord = move.coord;
        while (processed.equals(last) === false) {
            this.moveds.push(processed);
            this.moveds.push(processed.getNext(move.dir));
            processed = processed.getNext(alignement);
        }
    }
    public async onPieceClick(x: number, y: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#piece_' + x + '_' + y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        const ENEMY: number = this.rules.node.gamePartSlice.getCurrentEnnemy().value;
        if (this.board[y][x] === ENEMY) {
            return this.enemyClick(x, y);
        }
        if (this.selecteds.length === 0) {
            return this.firstClick(x, y);
        } else if (this.selecteds.length === 1) {
            return this.secondClick(x, y);
        } else {
            return this.thirdClick(x, y);
        }
    }
    private async enemyClick(x: number, y: number): Promise<MGPValidation> {
        const directionValidity: MGPValidation = await this.tryChoosingDirection(x, y);
        if (directionValidity.isSuccess()) {
            return MGPValidation.SUCCESS;
        } else {
            return this.cancelMove(RulesFailure.CANNOT_CHOOSE_ENEMY_PIECE);
        }
    }
    private async firstClick(x: number, y: number): Promise<MGPValidation> {
        this.selecteds = [new Coord(x, y)];
        this.showPossibleDirections();
        return MGPValidation.SUCCESS;
    }
    private showPossibleDirections(): void {
        this.directions = [];
        if (this.selecteds.length === 1) {
            this.showDirection(true);
        } else {
            this.showDirection(false);
        }
    }
    private showDirection(single: boolean): void {
        const state: AbaloneGameState = this.rules.node.gamePartSlice;
        const PLAYER: number = state.getCurrentPlayer().value;
        const firstPiece: Coord = this.selecteds[0];
        const lastPiece: Coord = this.selecteds[this.selecteds.length - 1];
        for (const dir of HexaDirection.factory.all) {
            let pointed: Coord = firstPiece.getNext(dir, 1);
            if (state.getNullable(pointed) === PLAYER) {
                if (single) {
                    continue;
                } else {
                    pointed = lastPiece.getNext(dir, 1);
                    if (state.getNullable(pointed) === PLAYER) {
                        continue;
                    }
                }
            }
            let theoritical: AbaloneMove;
            if (single) {
                theoritical = AbaloneMove.fromSingleCoord(firstPiece, dir);
            } else {
                theoritical = AbaloneMove.fromDoubleCoord(firstPiece, lastPiece, dir);
            }
            const isLegal: LegalityStatus = this.rules.isLegal(theoritical, state);
            if (isLegal.legal.isSuccess()) {
                const firstPieceCenter: Coord = this.getCenterAt(firstPiece);
                const pointedCenter: Coord = this.getCenterAt(pointed);
                const arrow: HexaDirArrow = new HexaDirArrow(firstPieceCenter,
                                                             pointedCenter,
                                                             pointed,
                                                             dir);
                this.directions.push(arrow);
            }
        }
    }
    public isBoard(c: number): boolean {
        return c !== FourStatePiece.NONE.value;
    }
    public isPiece(c: number): boolean {
        return c !== FourStatePiece.EMPTY.value;
    }
    private async secondClick(x: number, y: number): Promise<MGPValidation> {
        const firstPiece: Coord = this.selecteds[0];
        const coord: Coord = new Coord(x, y);
        if (coord.equals(firstPiece)) {
            this.cancelMoveAttempt();
            return MGPValidation.SUCCESS;
        }
        if (coord.isHexagonalyAlignedWith(firstPiece) === false) {
            this.cancelMoveAttempt();
            return this.firstClick(x, y);
        }
        const distance: number = coord.getDistance(firstPiece);
        if (distance > 2) {
            return this.cancelMove(AbaloneFailure.CANNOT_MOVE_MORE_THAN_THREE_PIECES);
        }
        const alignement: HexaDirection = firstPiece.getDirectionToward(coord);
        this.selecteds = [firstPiece];
        for (let i: number = 0; i < distance; i++) {
            this.selecteds.push(firstPiece.getNext(alignement, i + 1));
        }
        if (this.selecteds.length === 3) {
            const middle: Coord = this.selecteds[1];
            const PLAYER: number = this.rules.node.gamePartSlice.getCurrentPlayer().value;
            if (this.board[middle.y][middle.x] !== PLAYER) {
                this.cancelMoveAttempt();
                return this.firstClick(x, y);
            }
        }
        this.showPossibleDirections();
        return MGPValidation.SUCCESS;
    }
    private async thirdClick(x: number, y: number): Promise<MGPValidation> {
        const clicked: Coord = new Coord(x, y);
        const firstPiece: Coord = this.selecteds[0];
        if (clicked.equals(firstPiece)) {
            return this.deselectExtremity(true);
            // move firstPiece one step closer to lastPiece if possible
        }
        const lastPiece: Coord = this.selecteds[this.selecteds.length - 1];
        if (clicked.equals(lastPiece)) {
            return this.deselectExtremity(false);
            // move lastPiece one step closer to firstPiece if possible
        }
        if (this.selecteds.length === 3 && clicked.equals(this.selecteds[1])) {
            this.cancelMoveAttempt();
            return MGPValidation.SUCCESS;
        }
        return this.tryExtension(clicked, firstPiece, lastPiece);
    }
    private async tryExtension(clicked: Coord, firstPiece: Coord, lastPiece: Coord): Promise<MGPValidation> {
        const alignement: MGPOptional<Direction> = firstPiece.tryGetDirection(clicked);
        if (alignement.isPresent()) {
            const secondAlignement: MGPOptional<Direction> = lastPiece.tryGetDirection(clicked);
            if (alignement.equals(secondAlignement)) {
                // then it's an extension of the line
                const firstDistance: number = firstPiece.getDistance(clicked);
                const secondDistance: number = lastPiece.getDistance(clicked);
                if (Math.max(firstDistance, secondDistance) === 2) {
                    this.selecteds.push(clicked);
                    ArrayUtils.sortByDescending(this.selecteds, AbaloneMove.sortCoord);
                    this.showPossibleDirections();
                    return MGPValidation.SUCCESS;
                } else {
                    return this.cancelMove(AbaloneFailure.CANNOT_MOVE_MORE_THAN_THREE_PIECES);
                }
            }
        }
        const legality: MGPValidation = this.cancelMove(AbaloneFailure.LINE_AND_COORD_NOT_ALIGNED);
        this.firstClick(clicked.x, clicked.y);
        return legality;
    }
    private async deselectExtremity(first: boolean): Promise<MGPValidation> {
        const start: number = first ? 1 : 0;
        const end: number = first ? undefined : -1;
        this.selecteds = this.selecteds.slice(start, end);
        this.showPossibleDirections();
        return MGPValidation.SUCCESS;
    }
    public async chooseDirection(dir: HexaDirection): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#direction_' + dir.toString());
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        return this._chooseDirection(dir);
    }
    private async _chooseDirection(dir: HexaDirection): Promise<MGPValidation> {
        const state: AbaloneGameState = this.rules.node.gamePartSlice;
        let move: AbaloneMove;
        const firstPiece: Coord = this.selecteds[0];
        if (this.selecteds.length === 1) {
            move = AbaloneMove.fromSingleCoord(firstPiece, dir);
        } else {
            const lastPiece: Coord = this.selecteds[this.selecteds.length - 1];
            move = AbaloneMove.fromDoubleCoord(firstPiece, lastPiece, dir);
        }
        return this.chooseMove(move, state, this.scores[0], this.scores[1]);
    }
    public async onCaseClick(x: number, y: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#case_' + x + '_' + y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        return this.tryChoosingDirection(x, y);
    }
    private async tryChoosingDirection(x: number, y: number): Promise<MGPValidation> {
        const clicked: Coord = new Coord(x, y);
        for (const direction of this.directions) {
            if (direction.landing.equals(clicked)) {
                return this._chooseDirection(direction.dir);
            }
        }
        return MGPValidation.failure('not a direction');
    }
    public getCaseClasses(x: number, y: number): string[] {
        const coord: Coord = new Coord(x, y);
        const classes: string[] = [];
        if (this.moveds.some((c: Coord) => c.equals(coord))) {
            classes.push('moved');
        }
        return classes;
    }
    public getPieceClasses(x: number, y: number): string[] {
        const coord: Coord = new Coord(x, y);
        const player: Player = Player.of(this.board[y][x]);
        const classes: string[] = [this.getPlayerClass(player)];
        if (this.selecteds.some((c: Coord) => c.equals(coord))) {
            classes.push('highlighted');
        }
        return classes;
    }
}