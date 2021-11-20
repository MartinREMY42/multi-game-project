import { Component } from '@angular/core';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { DraughtsLegalityStatus } from 'src/app/games/draughts/DraughtsLegalityStatus';
import { DraughtsMove } from 'src/app/games/draughts/DraughtsMove';
import { DraughtsState } from 'src/app/games/draughts/DraughtsState';
import { DraughtsRules } from 'src/app/games/draughts/DraughtsRules';
import { DraughtsMinimax } from 'src/app/games/draughts/DraughtsMinimax';
import { Coord } from 'src/app/jscaip/Coord';
import { Direction } from 'src/app/jscaip/Direction';
import { Player } from 'src/app/jscaip/Player';
import { RectangularGameComponent } from '../../components/game-components/rectangular-game-component/RectangularGameComponent';
import { PositionalDraughtsMinimax } from './PositionalDraughtsMinimax';
import { AttackDraughtsMinimax } from './AttackDraughtsMinimax';
import { MessageDisplayer } from 'src/app/services/message-displayer/MessageDisplayer';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';
import { DraughtsFailure } from './DraughtsFailure';
import { DraughtsTutorial } from './DraughtsTutorial';

@Component({
    selector: 'app-draughts',
    templateUrl: './draughts.component.html',
    styleUrls: ['../../components/game-components/game-component/game-component.css'],
})
export class DraughtsComponent extends RectangularGameComponent<DraughtsRules,
                                                                   DraughtsMove,
                                                                   DraughtsState,
                                                                   Player,
                                                                   DraughtsLegalityStatus>
{
    public NONE: Player = Player.NONE;

    public firstPiece: Coord = new Coord(-15, -1);

    private validExtensions: Coord[] = [];

    private phalanxValidLandings: Coord[] = [];

    public lastPiece: Coord = new Coord(-15, -1);

    private phalanxDirection: Direction;

    private phalanxMiddles: Coord[] = [];

    private moveds: Coord[] = [];

    private captureds: Coord[] = [];

    public constructor(messageDisplayer: MessageDisplayer) {
        super(messageDisplayer);
        this.rules = new DraughtsRules(DraughtsState);
        this.availableMinimaxes = [
            new DraughtsMinimax(this.rules, 'Normal'),
            new PositionalDraughtsMinimax(this.rules, 'Positional'),
            new AttackDraughtsMinimax(this.rules, 'Attack'),
        ];
        this.encoder = DraughtsMove.encoder;
        this.tutorial = new DraughtsTutorial().tutorial;
        this.updateBoard();
    }
    public updateBoard(): void {
        this.firstPiece = new Coord(-15, -1);
        this.lastPiece = new Coord(-15, -1);
        this.hidePreviousMove();
        if (this.rules.node.move != null) {
            this.showPreviousMove();
        }
        this.board = this.rules.node.gameState.getCopiedBoard();
    }
    private showPreviousMove() {
        const move: DraughtsMove = this.rules.node.move;
        let moved: Coord = move.coord;
        this.moveds = [moved];
        for (let i: number = 1; i < (move.stepSize + move.movedPieces); i++) {
            moved = moved.getNext(move.direction, 1);
            this.moveds.push(moved);
        }
        const PREVIOUS_OPPONENT: Player = this.rules.node.mother.gameState.getCurrentOpponent();
        while (moved.isInRange(14, 12) &&
               this.rules.node.mother.gameState.getPieceAt(moved) === PREVIOUS_OPPONENT) {
            this.captureds.push(moved);
            moved = moved.getNext(move.direction, 1);
        }
    }
    public async onClick(x: number, y: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#click_' + x + '_' + y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        if (this.firstPiece.x === -15) {
            return this.firstClick(x, y);
        } else if (this.lastPiece.x === -15) {
            return this.secondClick(x, y);
        } else {
            return this.thirdClick(x, y);
        }
    }
    private async firstClick(x: number, y: number): Promise<MGPValidation> {
        this.hidePreviousMove(); // TODO check if must be deleted
        const OPPONENT: Player = this.rules.node.gameState.getCurrentOpponent();
        const PLAYER: Player = this.rules.node.gameState.getCurrentPlayer();
        switch (this.board[y][x]) {
            case PLAYER:
                this.firstPiece = new Coord(x, y);
                this.validExtensions = this.getValidExtensions(PLAYER);
                this.phalanxValidLandings = this.getPhalanxValidLandings();
                break;
            case OPPONENT:
                return this.cancelMove(RulesFailure.CANNOT_CHOOSE_OPPONENT_PIECE());
            case Player.NONE:
                return this.cancelMove(RulesFailure.MUST_CHOOSE_OWN_PIECE_NOT_EMPTY());
        }
    }
    private hidePreviousMove() {
        this.captureds = [];
        this.moveds = [];
    }
    private getValidExtensions(PLAYER: Player): Coord[] {
        if (this.lastPiece.x === -15) {
            return this.getFirstPieceExtensions(PLAYER);
        } else {
            return this.getPhalanxValidExtensions(PLAYER);
        }
    }
    private getFirstPieceExtensions(PLAYER: Player): Coord[] {
        const extensions: Coord[] = [];
        for (const direction of Direction.DIRECTIONS) {
            let c: Coord = this.firstPiece.getNext(direction, 1);
            while (c.isInRange(14, 12) &&
                   this.board[c.y][c.x] === PLAYER) {
                extensions.push(c);
                c = c.getNext(direction, 1);
            }
        }
        return extensions;
    }
    private getPhalanxValidExtensions(PLAYER: Player): Coord[] {
        let direction: Direction = Direction.factory.fromMove(this.firstPiece, this.lastPiece).get();
        const forward: Coord = this.lastPiece.getNext(direction, 1);
        const extensionForward: Coord[] = this.getExtensionsToward(forward, direction, PLAYER);

        direction = direction.getOpposite();
        const backWard: Coord = this.firstPiece.getNext(direction, 1);
        const extensionsBackward: Coord[] = this.getExtensionsToward(backWard, direction, PLAYER);
        return extensionForward.concat(extensionsBackward);
    }
    private getExtensionsToward(coord: Coord, direction: Direction, PLAYER: Player): Coord[] {
        const extensions: Coord[] = [];
        while (coord.isInRange(14, 12) &&
               this.board[coord.y][coord.x] === PLAYER) {
            extensions.push(coord);
            coord = coord.getNext(direction, 1);
        }
        return extensions;
    }
    private getPhalanxValidLandings(): Coord[] {
        if (this.lastPiece.x === -15) {
            return this.getNeighbooringEmptyCases();
        } else {
            const dx: number = Math.abs(this.firstPiece.x - this.lastPiece.x);
            const dy: number = Math.abs(this.firstPiece.y - this.lastPiece.y);
            const phalanxSize: number = Math.max(dx, dy) + 1;

            let direction: Direction = Direction.factory.fromMove(this.firstPiece, this.lastPiece).get();
            const landingForward: Coord = this.lastPiece.getNext(direction, 1);
            const landingsForward: Coord[] = this.getLandingsToward(landingForward, direction, phalanxSize);

            direction = direction.getOpposite();
            const landingBackward: Coord = this.firstPiece.getNext(direction, 1);
            const landingsBackward: Coord[] = this.getLandingsToward(landingBackward, direction, phalanxSize);
            return landingsBackward.concat(landingsForward);
        }
    }
    private getNeighbooringEmptyCases(): Coord[] {
        const neighboors: Coord[] = [];
        for (const direction of Direction.DIRECTIONS) {
            const coord: Coord = this.firstPiece.getNext(direction, 1);
            if (coord.isInRange(14, 12) &&
                this.board[coord.y][coord.x] === Player.NONE) {
                neighboors.push(coord);
            }
        }
        return neighboors;
    }
    private getLandingsToward(landing: Coord, direction: Direction, phalanxSize: number): Coord[] {
        const PLAYER: Player = this.rules.node.gameState.getCurrentPlayer();
        const OPPONENT: Player = this.rules.node.gameState.getCurrentOpponent();
        const landings: Coord[] = [];
        while (landing.isInRange(14, 12) &&
               landings.length < phalanxSize &&
               this.board[landing.y][landing.x] !== PLAYER) {
            if (this.board[landing.y][landing.x] === OPPONENT) {
                if (this.getPhalanxLength(landing, direction, OPPONENT) < phalanxSize) {
                    landings.push(landing);
                }
                return landings;
            } else {
                landings.push(landing);
                landing = landing.getNext(direction, 1);
            }
        }
        return landings;
    }
    private getPhalanxLength(firstPiece: Coord, direction: Direction, owner: Player): number {
        let length: number = 0;
        while (firstPiece.isInRange(14, 12) &&
               this.board[firstPiece.y][firstPiece.x] === owner)
        {
            length++;
            firstPiece = firstPiece.getNext(direction, 1);
        }
        return length;
    }
    public cancelMoveAttempt(): void {
        this.firstPiece = new Coord(-15, -1);
        this.validExtensions = [];
        this.phalanxValidLandings = [];
        this.lastPiece = new Coord(-15, -1);
        this.phalanxMiddles = [];
        this.hidePreviousMove();
    }
    private async secondClick(x: number, y: number): Promise<MGPValidation> {
        const clicked: Coord = new Coord(x, y);
        if (clicked.equals(this.firstPiece)) {
            this.cancelMoveAttempt();
            return MGPValidation.SUCCESS;
        }
        const OPPONENT: Player = this.rules.node.gameState.getCurrentOpponent();
        const PLAYER: Player = this.rules.node.gameState.getCurrentPlayer();
        if (!clicked.isAlignedWith(this.firstPiece)) {
            return this.cancelMove(DraughtsFailure.CASE_NOT_ALIGNED_WITH_SELECTED());
        }
        const distance: number = clicked.getDistance(this.firstPiece);
        const direction: Direction = this.firstPiece.getDirectionToward(clicked).get();
        switch (this.board[y][x]) {
            case Player.NONE:
                if (distance === 1) {
                    return this.tryMove(new DraughtsMove(this.firstPiece.x, this.firstPiece.y, 1, 1, direction));
                } else {
                    return this.cancelMove(DraughtsFailure.SINGLE_PIECE_MUST_MOVE_BY_ONE());
                }
            case OPPONENT:
                return this.cancelMove(DraughtsFailure.SINGLE_PIECE_CANNOT_CAPTURE());
            case PLAYER:
                const incompleteMove: DraughtsMove = new DraughtsMove(this.firstPiece.x,
                                                                            this.firstPiece.y,
                                                                            distance,
                                                                            1,
                                                                            direction);
                const state: DraughtsState = this.rules.node.gameState;
                const phalanxValidity: MGPValidation = DraughtsRules.getPhalanxValidity(state, incompleteMove);
                if (phalanxValidity.isFailure()) {
                    return this.cancelMove(phalanxValidity.reason);
                } else {
                    this.lastPiece = clicked;
                    this.validExtensions = this.getValidExtensions(PLAYER);
                    this.phalanxValidLandings = this.getPhalanxValidLandings();
                    this.phalanxMiddles = this.firstPiece.getCoordsToward(this.lastPiece);
                    this.phalanxDirection = direction;
                    return;
                }
        }
    }
    private async thirdClick(x: number, y: number): Promise<MGPValidation> {
        const PLAYER: Player = this.rules.node.gameState.getCurrentPlayer();
        const clicked: Coord = new Coord(x, y);
        if (clicked.equals(this.firstPiece)) {
            return this.moveFirstPiece(PLAYER);
        }
        if (clicked.equals(this.lastPiece)) {
            return this.moveLastPiece(PLAYER);
        }
        if (!clicked.isAlignedWith(this.firstPiece)) {
            return this.cancelMove(DraughtsFailure.CASE_NOT_ALIGNED_WITH_PHALANX());
        }
        // The directions are valid because they are is aligned
        let phalanxDirection: Direction = Direction.factory.fromMove(this.firstPiece, this.lastPiece).get();
        const phalanxLanding: Direction = Direction.factory.fromMove(this.firstPiece, clicked).get();
        if (phalanxDirection === phalanxLanding.getOpposite()) {
            const firstPiece: Coord = this.firstPiece;
            this.firstPiece = this.lastPiece;
            this.lastPiece = firstPiece;
            phalanxDirection = phalanxLanding;
        }
        if (phalanxDirection !== phalanxLanding) {
            return this.cancelMove(DraughtsFailure.CASE_NOT_ALIGNED_WITH_PHALANX());
        }
        if (this.board[y][x] === PLAYER) {
            this.lastPiece = clicked;
            const phalanxSize: number = this.firstPiece.getDistance(this.lastPiece) + 1;
            const incompleteMove: DraughtsMove = new DraughtsMove(this.firstPiece.x,
                                                                        this.firstPiece.y,
                                                                        phalanxSize,
                                                                        1,
                                                                        phalanxDirection);
            const phalanxValidity: MGPValidation = DraughtsRules.getPhalanxValidity(this.rules.node.gameState,
                                                                                       incompleteMove);
            if (phalanxValidity.isFailure()) {
                return this.cancelMove(phalanxValidity.reason);
            } else {
                this.phalanxMiddles = this.firstPiece.getCoordsToward(this.lastPiece);
                this.validExtensions = this.getValidExtensions(PLAYER);
                this.phalanxValidLandings = this.getPhalanxValidLandings();
                return;
            }
        } else {
            const phalanxSize: number = this.firstPiece.getDistance(this.lastPiece) + 1;
            const stepSize: number = this.lastPiece.getDistance(clicked);
            const move: DraughtsMove = new DraughtsMove(this.firstPiece.x,
                                                              this.firstPiece.y,
                                                              phalanxSize,
                                                              stepSize,
                                                              phalanxDirection);
            return this.tryMove(move);
        }
    }
    private async moveFirstPiece(PLAYER: Player): Promise<MGPValidation> {
        this.firstPiece = this.firstPiece.getNext(this.phalanxDirection, 1);
        if (this.firstPiece.equals(this.lastPiece)) {
            this.lastPiece = new Coord(-15, -1);
            this.validExtensions = this.getFirstPieceExtensions(PLAYER);
            this.phalanxDirection = null;
            this.phalanxMiddles = [];
        } else {
            this.phalanxMiddles = this.phalanxMiddles.slice(1);
            this.validExtensions = this.getPhalanxValidExtensions(PLAYER);
        }

        this.phalanxValidLandings = this.getPhalanxValidLandings();
        return MGPValidation.SUCCESS;
    }
    private async moveLastPiece(PLAYER: Player): Promise<MGPValidation> {
        this.lastPiece = this.lastPiece.getPrevious(this.phalanxDirection, 1);
        if (this.firstPiece.equals(this.lastPiece)) {
            this.lastPiece = new Coord(-15, -1);
            this.validExtensions = this.getFirstPieceExtensions(PLAYER);
            this.phalanxDirection = null;
            this.phalanxMiddles = [];
        } else {
            this.phalanxMiddles = this.firstPiece.getCoordsToward(this.lastPiece);
            this.validExtensions = this.getPhalanxValidExtensions(PLAYER);
        }

        this.phalanxValidLandings = this.getPhalanxValidLandings();
        return MGPValidation.SUCCESS;
    }
    public tryMove(move: DraughtsMove): Promise<MGPValidation> {
        const state: DraughtsState = this.rules.node.gameState;
        this.cancelMove();
        return this.chooseMove(move, state, null, null);
    }
    public getPieceClasses(x: number, y: number): string[] {
        const player: string = this.getPlayerClass(this.board[y][x]);
        const stroke: string[] = this.getPieceStrokeClasses(x, y);
        return stroke.concat([player]);
    }
    private getPieceStrokeClasses(x: number, y: number): string[] {
        // Show pieces belonging to the phalanx to move
        const coord: Coord = new Coord(x, y);
        if (this.firstPiece.x === -15 && this.lastPiece.x === -15) {
            return [];
        }
        if (this.firstPiece.equals(coord) ||
            this.lastPiece.equals(coord) ||
            this.phalanxMiddles.some((c: Coord) => c.equals(coord))) {
            return ['highlighted'];
        } else {
            return [];
        }
    }
    public getRectClasses(x: number, y: number): string[] {
        const clicked: Coord = new Coord(x, y);
        if (this.captureds.some((c: Coord) => c.equals(clicked))) {
            return ['captured'];
        } else if (this.moveds.some((c: Coord) => c.equals(clicked))) {
            return ['moved'];
        }
        return [];
    }
    public getHighlightedCoords(): Coord[] {
        if (this.firstPiece.x === -15 && this.isPlayerTurn()) {
            return this.getCurrentPlayerPieces();
        } else {
            return this.phalanxValidLandings.concat(this.validExtensions);
        }
    }
    private getCurrentPlayerPieces(): Coord[] {
        const pieces: Coord[] = [];
        const state: DraughtsState = this.rules.node.gameState;
        const player: Player = state.getCurrentPlayer();
        for (let y: number = 0; y < this.board.length; y++) {
            for (let x: number = 0; x < this.board[y].length; x++) {
                if (this.board[y][x] === player) {
                    pieces.push(new Coord(x, y));
                }
            }
        }
        return pieces;
    }
}
