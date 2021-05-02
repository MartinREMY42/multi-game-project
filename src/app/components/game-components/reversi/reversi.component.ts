import { Component } from '@angular/core';
import { AbstractGameComponent } from '../abstract-game-component/AbstractGameComponent';
import { ReversiRules } from '../../../games/reversi/ReversiRules';
import { ReversiPartSlice } from '../../../games/reversi/ReversiPartSlice';
import { ReversiMove } from 'src/app/games/reversi/ReversiMove';
import { ReversiLegalityStatus } from 'src/app/games/reversi/ReversiLegalityStatus';
import { Coord } from 'src/app/jscaip/coord/Coord';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MGPValidation } from 'src/app/utils/mgp-validation/MGPValidation';
import { Player } from 'src/app/jscaip/player/Player';
import { Direction } from 'src/app/jscaip/Direction';

@Component({
    selector: 'app-reversi',
    templateUrl: './reversi.component.html',
    styleUrls: ['../abstract-game-component/abstract-game-component.css'],
})
export class ReversiComponent extends AbstractGameComponent<ReversiMove, ReversiPartSlice, ReversiLegalityStatus> {
    public CASE_SIZE: number = 100;
    public NONE: number = Player.NONE.value;
    public lastMove: Coord = new Coord(-2, -2);

    public scores: number[] = [2, 2];

    private captureds: Coord[] = [];

    constructor(snackBar: MatSnackBar) {
        super(snackBar);
        this.showScore = true;
        this.canPass = false;
        this.rules = new ReversiRules(ReversiPartSlice);
    }
    public async onClick(x: number, y: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#click_' + x + '_' + y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        this.lastMove = new Coord(-1, -1); // now the user stop try to do a move
        // we stop showing him the last move
        const chosenMove: ReversiMove = new ReversiMove(x, y);

        return await this.chooseMove(chosenMove, this.rules.node.gamePartSlice, this.scores[0], this.scores [1]);
    }
    public decodeMove(encodedMove: number): ReversiMove {
        return ReversiMove.decode(encodedMove);
    }
    public encodeMove(move: ReversiMove): number {
        return move.encode();
    }
    public updateBoard(): void {
        const slice: ReversiPartSlice = this.rules.node.gamePartSlice;

        this.board = slice.getCopiedBoard();
        this.captureds = [];

        if (this.rules.node.move) {
            this.lastMove = this.rules.node.move.coord;
            this.showPreviousMove();
        } else {
            this.lastMove = new Coord(-2, -2);
        }

        this.scores = slice.countScore();
        this.canPass = ReversiRules.playerCanOnlyPass(slice);
    }
    private showPreviousMove() {
        const PLAYER: number = this.rules.node.gamePartSlice.getCurrentPlayer().value;
        const ENNEMY: number = this.rules.node.gamePartSlice.getCurrentEnnemy().value;
        for (const dir of Direction.DIRECTIONS) {
            let captured: Coord = this.lastMove.getNext(dir, 1);
            while (captured.isInRange(ReversiPartSlice.BOARD_WIDTH, ReversiPartSlice.BOARD_HEIGHT) &&
                this.rules.node.gamePartSlice.getBoardAt(captured) === ENNEMY &&
                this.rules.node.mother.gamePartSlice.getBoardAt(captured) === PLAYER)
            {
                this.captureds.push(captured);
                captured = captured.getNext(dir, 1);
            }
        }
    }
    public getRectClasses(x: number, y: number): string[] {
        const coord: Coord = new Coord(x, y);
        if (this.captureds.some((c: Coord) => c.equals(coord))) {
            return ['captured'];
        } else if (coord.equals(this.lastMove)) {
            return ['moved'];
        } else {
            return [];
        }
    }
    public getPieceClass(x: number, y: number): string {
        return this.getPlayerClass(Player.of(this.board[y][x]));
    }
    public async pass(): Promise<MGPValidation> {
        return this.onClick(ReversiMove.PASS.coord.x, ReversiMove.PASS.coord.y);
    }
}
