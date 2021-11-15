 import { Component } from '@angular/core';
import { GameComponent } from '../../components/game-components/game-component/GameComponent';
import { PylosMove } from 'src/app/games/pylos/PylosMove';
import { PylosState } from 'src/app/games/pylos/PylosState';
import { PylosRules } from 'src/app/games/pylos/PylosRules';
import { PylosMinimax } from 'src/app/games/pylos/PylosMinimax';
import { PylosCoord } from 'src/app/games/pylos/PylosCoord';
import { Player } from 'src/app/jscaip/Player';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { PylosOrderedMinimax } from './PylosOrderedMinimax';
import { MessageDisplayer } from 'src/app/services/message-displayer/MessageDisplayer';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';
import { PylosFailure } from './PylosFailure';
import { PylosTutorial } from './PylosTutorial';
import { Utils } from 'src/app/utils/utils';

@Component({
    selector: 'app-pylos',
    templateUrl: './pylos.component.html',
    styleUrls: ['../../components/game-components/game-component/game-component.scss'],
})
export class PylosComponent extends GameComponent<PylosRules, PylosMove, PylosState> {

    public static VERBOSE: boolean = false;

    public state: PylosState;

    public lastLandingCoord: PylosCoord | null = null;
    public lastStartingCoord: PylosCoord | null = null;
    public lastFirstCapture: PylosCoord | null = null;
    public lastSecondCapture: PylosCoord | null= null;
    public highCapture: PylosCoord | null = null;

    public chosenStartingCoord: PylosCoord | null = null;
    public chosenLandingCoord: PylosCoord | null = null;
    public chosenFirstCapture: PylosCoord | null = null;

    public lastMove: PylosMove | null = null;

    private remainingPieces: { [owner: number]: number } = { 0: 15, 1: 15 };

    public constructor(messageDisplayer: MessageDisplayer) {
        super(messageDisplayer);
        this.rules = new PylosRules(PylosState);
        this.availableMinimaxes = [
            new PylosMinimax(this.rules, 'PylosMinimax'),
            new PylosOrderedMinimax(this.rules, 'PylosOrderedMinimax'),
        ];
        this.encoder = PylosMove.encoder;
        this.tutorial = new PylosTutorial().tutorial;
        this.SPACE_SIZE = this.getPieceRadius(0);
        this.updateBoard();
    }
    public getLevelRange(z: number): number[] {
        switch (z) {
            case 0: return [0, 1, 2, 3];
            case 1: return [0, 1, 2];
            default:
                Utils.expectToBe(z, 2);
                return [0, 1];
        }
    }
    public isDrawable(x: number, y: number, z: number): boolean {
        const coord: PylosCoord = new PylosCoord(x, y, z);
        if (this.state.getPieceAt(coord) === Player.NONE) {
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
        const clickedPiece: Player = this.state.getPieceAt(clickedCoord);
        const pieceBelongToOpponent: boolean = clickedPiece === this.state.getCurrentOpponent();
        if (pieceBelongToOpponent) {
            return this.cancelMove(RulesFailure.CANNOT_CHOOSE_OPPONENT_PIECE());
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
            move = PylosMove.fromDrop(Utils.getNonNullable(this.chosenLandingCoord), captures);
        } else {
            move = PylosMove.fromClimb(this.chosenStartingCoord,
                                       Utils.getNonNullable(this.chosenLandingCoord), captures);
        }
        return this.tryMove(move, this.state);
    }
    private async tryMove(move: PylosMove, state: PylosState): Promise<MGPValidation> {
        this.cancelMove();
        return this.chooseMove(move, state);
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
                return this.cancelMove(PylosFailure.MUST_MOVE_UPWARD());
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
            if (this.lastMove.firstCapture.isPresent() && coord.equals(this.lastMove.firstCapture.get()) ||
                this.lastMove.secondCapture.isPresent() && coord.equals(this.lastMove.secondCapture.get())) {
                return ['captured'];
            } else if (coord.equals(this.lastMove.landingCoord) ||
                       this.lastMove.startingCoord.isPresent() && coord.equals(this.lastMove.startingCoord.get())) {
                return ['moved'];
            }
        }
        return [];
    }
    public getPieceRadius(z: number): number {
        return 90 + (z * 5);
    }
    public getPieceCx(x: number, _y: number, z: number): number {
        return 100 + (z * 100) + (x * 200);
    }
    public getPieceCy(_x: number, y: number, z: number): number {
        return 100 + (z * 100) + (y * 200);
    }
    public isOccupied(x: number, y: number, z: number): boolean {
        const coord: PylosCoord = new PylosCoord(x, y, z);
        const reallyOccupied: boolean = this.rules.node.gameState.getPieceAt(coord) !== Player.NONE;
        const landingCoord: boolean = this.chosenLandingCoord != null && coord.equals(this.chosenLandingCoord);
        return reallyOccupied || landingCoord;
    }
    public getPieceClasses(x: number, y: number, z: number): string[] {
        const c: PylosCoord = new PylosCoord(x, y, z);
        const classes: string[] = [this.getPieceFillClass(c)];
        if (this.lastLandingCoord && c.equals(this.lastLandingCoord) ||
            this.lastStartingCoord && c.equals(this.lastStartingCoord)) {
            classes.push('highlighted');
        }
        if (this.chosenStartingCoord && c.equals(this.chosenStartingCoord) ||
            this.chosenLandingCoord && c.equals(this.chosenLandingCoord)) {
            classes.push('selected');
        }
        if (this.chosenFirstCapture && c.equals(this.chosenFirstCapture)) {
            classes.push('pre-captured');
        }
        return classes;
    }
    private getPieceFillClass(c: PylosCoord): string {
        if (this.chosenLandingCoord && c.equals(this.chosenLandingCoord)) {
            return this.getPlayerClass(this.state.getCurrentPlayer());
        }
        return this.getPlayerPieceClass(this.state.getPieceAt(c).value);
    }
    public getPlayerPieceClass(player: number): string {
        return this.getPlayerClass(Player.of(player));
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
        this.state = this.rules.node.gameState;
        this.lastMove = this.rules.node.move;
        const repartition: { [owner: number]: number } = this.state.getPiecesRepartition();
        this.remainingPieces = { 0: 15 - repartition[0], 1: 15 - repartition[1] };
        this.highCapture = null;
        if (this.lastMove) {
            this.showLastMove();
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
    private showLastMove(): void {
        const lastMove: PylosMove = Utils.getNonNullable(this.lastMove);
        this.lastLandingCoord = lastMove.landingCoord;
        this.lastStartingCoord = lastMove.startingCoord.getOrNull();
        this.lastFirstCapture = lastMove.firstCapture.getOrNull();
        this.lastSecondCapture = lastMove.secondCapture.getOrNull();
        if (this.lastFirstCapture &&
            this.isDrawableCoord(this.lastFirstCapture) === false)
        {
            this.highCapture = this.lastFirstCapture;
        }
    }
    private isDrawableCoord(coord: PylosCoord): boolean {
        const x: number = coord.x;
        const y: number = coord.y;
        const z: number = coord.z;
        return this.isDrawable(x, y, z);
    }
}
