import { Component, OnInit } from '@angular/core';
import { GameComponent } from 'src/app/components/game-components/game-component/GameComponent';
import { Coord } from 'src/app/jscaip/Coord';
import { Direction } from 'src/app/jscaip/Direction';
import { Player } from 'src/app/jscaip/Player';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';
import { MessageDisplayer } from 'src/app/services/MessageDisplayer';
import { ArrayUtils } from 'src/app/utils/ArrayUtils';
import { assert } from 'src/app/utils/assert';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { LodestoneFailure } from './LodestoneFailure';
import { LodestoneCaptures, LodestoneMove } from './LodestoneMove';
import { LodestoneDirection, LodestonePiece } from './LodestonePiece';
import { LodestoneInfos, LodestoneRules } from './LodestoneRules';
import { LodestonePressurePlate, LodestonePressurePlatePosition, LodestoneState } from './LodestoneState';

interface LodestoneInfo {
    direction: LodestoneDirection,
    pieceClasses: string[],
    movingClass: string,
    diagonal: boolean,
}

interface PressurePlateInfo {
    position: LodestonePressurePlatePosition,
    coords: PressurePlateCoordInfo[],
}

interface PressurePlateCoordInfo {
    coord: Coord,
    hasPiece: boolean,
    pieceClass: string,
    squareClasses: string[],
}

interface ViewInfo {
    boardInfo: SquareInfo[][],
    availableLodestones: LodestoneInfo[],
    pressurePlates: PressurePlateInfo[],
    currentPlayerClass: string,
    opponentClass: string,
}

interface SquareInfo {
    coord: Coord,
    squareClasses: string[],
    crumbled: boolean,
    hasPiece: boolean,
    pieceClasses: string[],
    lodestone?: LodestoneInfo,
}

@Component({
    selector: 'app-lodestone',
    templateUrl: './lodestone.component.html',
    styleUrls: ['../../components/game-components/game-component/game-component.scss'],
})
export class LodestoneComponent
    extends GameComponent<LodestoneRules, LodestoneMove, LodestoneState, LodestoneInfos>
    implements OnInit
{
    public PIECE_RADIUS: number;
    public viewInfo: ViewInfo = {
        availableLodestones: [],
        boardInfo: [],
        currentPlayerClass: '',
        opponentClass: '',
        pressurePlates: [],
    };

    private displayedState: LodestoneState;
    private capturesToPlace: number = 0;
    public selectedCoord: MGPOptional<Coord> = MGPOptional.empty(); // TODO: private + add to viewInfo?
    private selectedLodestone: MGPOptional<[LodestoneDirection, boolean]> = MGPOptional.empty();
    private captures: LodestoneCaptures = { top: 0, bottom: 0, left: 0, right: 0 };

    public constructor(messageDisplayer: MessageDisplayer) {
        super(messageDisplayer);
        this.rules = LodestoneRules.get();
        this.availableMinimaxes = [
            // TODO
        ];
        this.encoder = LodestoneMove.encoder;
        this.PIECE_RADIUS = (this.SPACE_SIZE - (2 * this.STROKE_WIDTH)) * 0.5;
        this.displayedState = this.rules.node.gameState;
    }
    public ngOnInit(): void {
        this.updateBoard();
    }
    public async selectCoord(coord: Coord): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#square_' + coord.x + '_' + coord.y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }

        if (this.capturesToPlace > 0) {
            return this.cancelMove(LodestoneFailure.MUST_PLACE_CAPTURES());
        }

        const state: LodestoneState = this.getState();
        const piece: LodestonePiece = state.getPieceAt(coord);
        if (piece.isEmpty() === false || piece.isUnreachable()) {
            return this.cancelMove(RulesFailure.MUST_CLICK_ON_EMPTY_SQUARE());
        }
        if (this.selectedLodestone.isPresent()) {
            this.selectedCoord = MGPOptional.of(coord);
            return this.putLodestone();
        } else {
            this.selectedCoord = MGPOptional.of(coord);
            this.updateViewInfo();
            return MGPValidation.SUCCESS;
        }
    }
    public async selectLodestone(direction: LodestoneDirection, diagonal: boolean): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#lodestone_' + direction + '_' + (diagonal ? 'diagonal' : 'orthogonal'));
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }

        if (this.capturesToPlace > 0) {
            return this.cancelMove(LodestoneFailure.MUST_PLACE_CAPTURES());
        }

        if (this.selectedCoord.isPresent()) {
            this.selectedLodestone = MGPOptional.of([direction, diagonal]);
            return this.putLodestone();
        } else {
            this.selectedLodestone = MGPOptional.of([direction, diagonal]);
            this.updateViewInfo();
            return MGPValidation.SUCCESS;
        }
    }
    private async putLodestone(): Promise<MGPValidation> {
        assert(this.selectedCoord.isPresent(), 'coord should have been selected');
        assert(this.selectedLodestone.isPresent(), 'lodestone should have been selected');
        const coord: Coord = this.selectedCoord.get();
        const [direction, diagonal]: [LodestoneDirection, boolean] = this.selectedLodestone.get();
        const state: LodestoneState = this.getState();
        const validity: MGPValidation = LodestoneRules.get().isLegalWithoutCaptures(state, coord, direction);
        if (validity.isSuccess()) {
            const [board, captures]: [LodestonePiece[][], Coord[]] =
                LodestoneRules.get().applyMoveWithoutPlacingCaptures(state, coord, direction, diagonal);
            this.capturesToPlace = Math.min(captures.length, state.remainingSpaces());
            this.displayedState = this.displayedState.withBoard(board);
            return this.applyMoveIfNoRemainingCapture();
        } else {
            return this.cancelMove(validity.getReason());
        }
    }
    private async applyMoveIfNoRemainingCapture(): Promise<MGPValidation> {
        assert(this.selectedCoord.isPresent(), 'coord should have been selected');
        assert(this.selectedLodestone.isPresent(), 'lodestone should have been selected');
        const coord: Coord = this.selectedCoord.get();
        const [direction, diagonal]: [LodestoneDirection, boolean] = this.selectedLodestone.get();
        if (this.capturesToPlace === 0) {
            const move: LodestoneMove = new LodestoneMove(coord, direction, diagonal, this.captures);
            return this.chooseMove(move, this.getState());
        } else {
            this.updateViewInfo();
        }
        return MGPValidation.SUCCESS;
    }
    public async selectPressurePlate(position: LodestonePressurePlatePosition): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#pressurePlate_' + position);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }

        assert(this.capturesToPlace > 0, 'there should be remaining captures to place');
        const opponent: Player = this.getCurrentPlayer().getOpponent();
        const board: LodestonePiece[][] = ArrayUtils.copyBiArray(this.displayedState.board);
        const pressurePlate: MGPOptional<LodestonePressurePlate> =
            LodestoneRules.get().updatePressurePlate(board,
                                                     position,
                                                     this.displayedState.pressurePlates[position],
                                                     opponent,
                                                     1);
        this.displayedState = this.displayedState.withBoardAndPressurePlate(board, position, pressurePlate);
        this.capturesToPlace--;
        this.captures[position]++;
        return this.applyMoveIfNoRemainingCapture();
    }
    public updateBoard(): void {
        this.displayedState = this.rules.node.gameState;
        this.updateViewInfo();
        const lastMove: MGPOptional<LodestoneMove> = this.rules.node.move;
        if (lastMove.isPresent()) {
            this.showLastMove();
        }
    }
    private updateViewInfo(): void {
        const state: LodestoneState = this.getState();
        const currentPlayer: Player = state.getCurrentPlayer();
        this.viewInfo.currentPlayerClass = this.getPlayerClass(currentPlayer);
        this.viewInfo.opponentClass = this.getPlayerClass(currentPlayer.getOpponent());
        this.showBoard();
        this.showAvailableLodestones();
        this.showPressurePlates();
    }
    private showBoard(): void {
        this.viewInfo.boardInfo = [];
        for (let y: number = 0; y < LodestoneState.SIZE; y++) {
            this.viewInfo.boardInfo.push([]);
            for (let x: number = 0; x < LodestoneState.SIZE; x++) {
                const coord: Coord = new Coord(x, y);
                const piece: LodestonePiece = this.displayedState.getPieceAt(coord);
                const squareInfo: SquareInfo = {
                    coord,
                    squareClasses: [],
                    crumbled: piece.isUnreachable(),
                    hasPiece: piece.isPlayerPiece(),
                    pieceClasses: [],
                };
                if (piece.isPlayerPiece()) {
                    squareInfo.pieceClasses = [this.getPlayerClass(piece.owner)];
                }
                if (piece.isLodestone()) {
                    squareInfo.lodestone = {
                        direction: piece.direction,
                        pieceClasses: [this.getPlayerClass(piece.owner)],
                        movingClass: '',
                        diagonal: piece.diagonal,
                    };
                    if (piece.direction === 'push') {
                        squareInfo.lodestone.movingClass = this.getPlayerClass(piece.owner.getOpponent());
                    } else {
                        squareInfo.lodestone.movingClass = this.getPlayerClass(piece.owner);
                    }

                }
                this.viewInfo.boardInfo[y].push(squareInfo);
            }
        }
    }
    private showAvailableLodestones(): void {
        const player: Player = this.displayedState.getCurrentPlayer();
        const nextDirection: MGPOptional<LodestoneDirection> = this.displayedState.nextLodestoneDirection();
        if (nextDirection.isPresent()) {
            this.viewInfo.availableLodestones = [
                this.nextLodestone(player, nextDirection.get(), true),
                this.nextLodestone(player, nextDirection.get(), false),
            ];
        } else {
            this.viewInfo.availableLodestones = [
                this.nextLodestone(player, 'push', true),
                this.nextLodestone(player, 'push', false),
                this.nextLodestone(player, 'pull', true),
                this.nextLodestone(player, 'pull', false),
            ];
        }
    }
    private nextLodestone(player: Player, direction: LodestoneDirection, diagonal: boolean): LodestoneInfo {
        const info: LodestoneInfo = {
            direction,
            pieceClasses: [this.getPlayerClass(player)],
            movingClass: '',
            diagonal: false,
        };
        if (direction === 'push') {
            info.movingClass = this.getPlayerClass(player.getOpponent());
        } else {
            info.movingClass = this.getPlayerClass(player);
        }
        if (this.selectedLodestone.isPresent() &&
            this.selectedLodestone.get()[0] === direction &&
            this.selectedLodestone.get()[1] === diagonal) {
            info.pieceClasses.push('selected');
        }
        if (diagonal) {
            info.diagonal = true;
        }
        return info;
    }
    private static readonly PRESSURE_PLATES_POSITIONS
    : Record<LodestonePressurePlatePosition, [Coord, Coord, Direction]> = {
        'top': [new Coord(0.5, -1), new Coord(1.5, 0), Direction.RIGHT],
        'bottom': [new Coord(0.5, 8), new Coord(1.5, 7), Direction.RIGHT],
        'left': [new Coord(-1, 0.5), new Coord(0, 1.5), Direction.DOWN],
        'right': [new Coord(8, 0.5), new Coord(7, 1.5), Direction.DOWN],
    };
    private showPressurePlates(): void {
        this.viewInfo.pressurePlates = [];
        for (const pressurePlate of LodestonePressurePlate.POSITIONS) {
            const plateCoordInfos: PressurePlateCoordInfo[] = [];
            const plate: MGPOptional<LodestonePressurePlate> = this.displayedState.pressurePlates[pressurePlate];
            if (plate.isPresent()) {
                const [start5, start3, dir]: [Coord, Coord, Direction] =
                    LodestoneComponent.PRESSURE_PLATES_POSITIONS[pressurePlate];
                const size: 3 | 5 = plate.get().width;
                let coord: Coord = size === 5 ? start5 : start3;
                for (let i: number = 0; i < size; i++) {
                    coord = coord.getNext(dir);
                    const content: LodestonePiece = plate.get().getPieceAt(i);
                    let pieceClass: string = '';
                    console.log({i})
                    if (content.isPlayerPiece()) {
                        console.log('is player piece')
                        pieceClass = this.getPlayerClass(content.owner);
                    }
                    plateCoordInfos.push({
                        coord,
                        hasPiece: content.isPlayerPiece(),
                        pieceClass,
                        squareClasses: [],
                    });
                }
            }
            this.viewInfo.pressurePlates.push({ position: pressurePlate, coords: plateCoordInfos });
        }
    }
    private showLastMove(): void {
        // TODO
    }
}
