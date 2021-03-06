import { Component } from '@angular/core';
import { AbstractGameComponent } from '../../components/game-components/abstract-game-component/AbstractGameComponent';
import { PylosMove } from 'src/app/games/pylos/PylosMove';
import { PylosPartSlice } from 'src/app/games/pylos/PylosPartSlice';
import { PylosRules } from 'src/app/games/pylos/PylosRules';
import { PylosMinimax } from 'src/app/games/pylos/PylosMinimax';
import { PylosCoord } from 'src/app/games/pylos/PylosCoord';
import { Player } from 'src/app/jscaip/Player';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { MoveEncoder } from 'src/app/jscaip/Encoder';
import { PylosOrderedMinimax } from './PylosOrderedMinimax';
import { MessageDisplayer } from 'src/app/services/message-displayer/MessageDisplayer';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';
import { PylosFailure } from './PylosFailure';

@Component({
    selector: 'app-pylos',
    templateUrl: './pylos.component.html',
    styleUrls: ['../../components/game-components/abstract-game-component/abstract-game-component.css'],
})
export class PylosComponent extends AbstractGameComponent<PylosMove, PylosPartSlice> {

    public static VERBOSE: boolean = false;

    public state: PylosPartSlice;

    public lastLandingCoord: PylosCoord = null;
    public lastStartingCoord: PylosCoord = null;
    public lastFirstCapture: PylosCoord = null;
    public lastSecondCapture: PylosCoord = null;
    public highCapture: PylosCoord = null;

    public chosenStartingCoord: PylosCoord = null;
    public chosenLandingCoord: PylosCoord = null;
    public chosenFirstCapture: PylosCoord = null;

    public lastMove: PylosMove = null;

    private remainingPieces: { [owner: number]: number } = { 0: 15, 1: 15 };

    public encoder: MoveEncoder<PylosMove> = PylosMove.encoder;

    public constructor(messageDisplayer: MessageDisplayer) {
        super(messageDisplayer);
        this.rules = new PylosRules(PylosPartSlice);
        this.state = this.rules.node.gamePartSlice;
        this.availableMinimaxes = [
            new PylosMinimax(this.rules, 'PylosMinimax'),
            new PylosOrderedMinimax(this.rules, 'PylosOrderedMinimax'),
        ];
    }
    public getLevelRange(z: number): number[] {
        switch (z) {
            case 0: return [0, 1, 2, 3];
            case 1: return [0, 1, 2];
            case 2: return [0, 1];
        }
    }
    public isDrawable(x: number, y: number, z: number): boolean {
        const coord: PylosCoord = new PylosCoord(x, y, z);
        if (this.state.getBoardAt(coord) === Player.NONE.value) {
            return this.state.isLandable(coord);
        } else {
            return true;
        }
    }
    public async onPieceClick(x: number, y: number, z: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#piece_' + x + '_' + y + '_' + z);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        const clickedCoord: PylosCoord = new PylosCoord(x, y, z);
        const clickedPiece: number = this.state.getBoardAt(clickedCoord);
        const pieceBelongToEnnemy: boolean = clickedPiece === this.state.getCurrentEnnemy().value;
        if (pieceBelongToEnnemy) {
            return this.cancelMove(RulesFailure.CANNOT_CHOOSE_ENEMY_PIECE);
        }
        if (this.chosenLandingCoord == null) {
            // Starting do describe a climbing move
            this.chosenStartingCoord = clickedCoord;
            return MGPValidation.SUCCESS;
        }
        // Starting to select capture
        if (this.chosenFirstCapture == null) { // First capture
            this.chosenFirstCapture = clickedCoord;
            return MGPValidation.SUCCESS;
        } else if (clickedCoord.equals(this.chosenFirstCapture)) {
            return this.concludeMoveWithCapture([this.chosenFirstCapture]);
        } else { // Last capture
            return this.concludeMoveWithCapture([this.chosenFirstCapture, clickedCoord]);
        }
    }
    private async concludeMoveWithCapture(captures: PylosCoord[]): Promise<MGPValidation> {
        let move: PylosMove;
        if (this.chosenStartingCoord == null) {
            move = PylosMove.fromDrop(this.chosenLandingCoord, captures);
        } else {
            move = PylosMove.fromClimb(this.chosenStartingCoord, this.chosenLandingCoord, captures);
        }
        return this.tryMove(move, this.state);
    }
    private async tryMove(move: PylosMove, slice: PylosPartSlice): Promise<MGPValidation> {
        this.cancelMove();
        return this.chooseMove(move, slice, null, null);
    }
    public cancelMoveAttempt(): void {
        this.chosenStartingCoord = null;
        this.chosenLandingCoord = null;
        this.chosenFirstCapture = null;
    }
    public async onDrop(x: number, y: number, z: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#drop_' + x + '_' + y + '_' + z);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        const clickedCoord: PylosCoord = new PylosCoord(x, y, z);
        if (PylosRules.canCapture(this.state, clickedCoord)) {
            this.chosenLandingCoord = clickedCoord;
            return MGPValidation.SUCCESS; // now player can click on his captures
        } else {
            if (this.isCapturelessMoveFinished(clickedCoord)) {
                this.chosenLandingCoord = clickedCoord;
                return this.concludeMoveWithCapture([]);
            } else {
                return this.cancelMove(PylosFailure.MUST_MOVE_UPWARD);
            }
        }
    }
    private isCapturelessMoveFinished(clickedCoord: PylosCoord): boolean {
        if (this.chosenStartingCoord == null) {
            // Drop without capture
            return true;
        }
        return clickedCoord.isUpperThan(this.chosenStartingCoord); // true if legal climbing (without capture)
    }
    public getCaseClasses(x: number, y: number, z: number): string[] {
        const coord: PylosCoord = new PylosCoord(x, y, z);
        if (this.lastMove) {
            if (coord.equals(this.lastMove.firstCapture.getOrNull()) ||
                coord.equals(this.lastMove.secondCapture.getOrNull())) {
                return ['captured'];
            } else if (coord.equals(this.lastMove.landingCoord) ||
                       coord.equals(this.lastMove.startingCoord.getOrNull())) {
                return ['moved'];
            }
        }
        return [];
    }
    public getPieceRay(z: number): number {
        return 90 + (z * 5);
    }
    public getPieceCx(x: number, y: number, z: number): number {
        return 100 + (z * 100) + (x * 200);
    }
    public getPieceCy(x: number, y: number, z: number): number {
        return 100 + (z * 100) + (y * 200);
    }
    public isOccupied(x: number, y: number, z: number): boolean {
        const coord: PylosCoord = new PylosCoord(x, y, z);
        const reallyOccupied: boolean = this.rules.node.gamePartSlice.getBoardAt(coord) !== Player.NONE.value;
        const landingCoord: boolean = coord.equals(this.chosenLandingCoord);
        return reallyOccupied || landingCoord;
    }
    public getPieceClasses(x: number, y: number, z: number): string[] {
        const c: PylosCoord = new PylosCoord(x, y, z);
        const classes: string[] = [this.getPieceFillClass(c)];
        if (c.equals(this.lastLandingCoord) || c.equals(this.lastStartingCoord)) {
            classes.push('highlighted');
        }
        if (c.equals(this.chosenStartingCoord) || c.equals(this.chosenLandingCoord)) {
            classes.push('selected');
        }
        if (c.equals(this.chosenFirstCapture)) {
            classes.push('pre-captured');
        }
        return classes;
    }
    private getPieceFillClass(c: PylosCoord): string {
        if (c.equals(this.chosenLandingCoord)) {
            return this.getPlayerClass(this.state.getCurrentPlayer());
        }
        return this.getPlayerPieceClass(this.state.getBoardAt(c));
    }
    public getPlayerPieceClass(player: number): string {
        return this.getPlayerClass(Player.of(player));
    }
    public getPieceSize(): number {
        return this.getPieceRay(0);
    }
    public getPlayerSidePieces(player: number): number[] {
        const nPieces: number = this.remainingPieces[player];
        const pieces: number[] = [];
        for (let i: number = 0; i < nPieces; i++) {
            pieces.push(i);
        }
        return pieces;
    }
    public updateBoard(): void {
        this.state = this.rules.node.gamePartSlice;
        this.lastMove = this.rules.node.move;
        const repartition: { [owner: number]: number } = this.state.getPiecesRepartition();
        this.remainingPieces = { 0: 15 - repartition[0], 1: 15 - repartition[1] };
        if (this.lastMove) {
            this.lastLandingCoord = this.lastMove.landingCoord;
            this.lastStartingCoord = this.lastMove.startingCoord.getOrNull();
            this.lastFirstCapture = this.lastMove.firstCapture.getOrNull();
            this.lastSecondCapture = this.lastMove.secondCapture.getOrNull();
            if (this.lastFirstCapture &&
                this.isDrawableCoord(this.lastFirstCapture) === false)
            {
                this.highCapture = this.lastFirstCapture;
            } else {
                this.highCapture = null;
            }
        } else {
            this.lastLandingCoord = null;
            this.lastStartingCoord = null;
            this.lastFirstCapture = null;
            this.lastSecondCapture = null;
            this.chosenFirstCapture = null;
            this.chosenStartingCoord = null;
            this.chosenLandingCoord = null;
        }
    }
    private isDrawableCoord(coord: PylosCoord): boolean {
        const x: number = coord.x;
        const y: number = coord.y;
        const z: number = coord.z;
        return this.isDrawable(x, y, z);
    }
}
