import { Component } from '@angular/core';
import { HexagonalGameComponent } from 'src/app/components/game-components/abstract-game-component/HexagonalGameComponent';
import { Coord } from 'src/app/jscaip/Coord';
import { MoveEncoder } from 'src/app/jscaip/Encoder';
import { HexaDirection } from 'src/app/jscaip/HexaDirection';
import { HexaLayout } from 'src/app/jscaip/HexaLayout';
import { FlatHexaOrientation } from 'src/app/jscaip/HexaOrientation';
import { Player } from 'src/app/jscaip/Player';
import { MessageDisplayer } from 'src/app/services/message-displayer/MessageDisplayer';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { assert } from 'src/app/utils/utils';
import { YinshFailure } from './YinshFailure';
import { YinshGameState } from './YinshGameState';
import { YinshLegalityStatus } from './YinshLegalityStatus';
import { YinshMinimax } from './YinshMinimax';
import { YinshCapture, YinshMove } from './YinshMove';
import { YinshPiece } from './YinshPiece';
import { YinshRules } from './YinshRules';

interface CaseInfo {
    coord: Coord,
    coordinates: string,
    caseClasses: string[],
    markerClasses: string[],
    ringClasses: string[],
    isMarker: boolean,
    isRing: boolean,
    center: Coord,
    removedClass: string,
}

interface ViewInfo {
    caseInfo: CaseInfo[][],
    selectableCoords: Coord[],
    selectedCoords: Coord[],
    markerSize: number,
    ringOuterSize: number,
    ringMidSize: number,
    ringInnerSize: number,
    sideRings: [number, number],
    sideRingClass: [string, string],
}

@Component({
    selector: 'app-yinsh',
    templateUrl: './yinsh.component.html',
    styleUrls: ['../../components/game-components/abstract-game-component/abstract-game-component.css'],
})
export class YinshComponent extends HexagonalGameComponent<YinshMove, YinshGameState, YinshLegalityStatus> {
    private static RING_OUTER_SIZE: number = 40;
    private static RING_MID_SIZE: number = 34;
    private static RING_INNER_SIZE: number = 28;
    private static MARKER_SIZE: number = YinshComponent.RING_INNER_SIZE;

    public rules: YinshRules = new YinshRules(YinshGameState);

    public hexaLayout: HexaLayout = new HexaLayout(YinshComponent.RING_OUTER_SIZE * 1.50,
                                                   new Coord(YinshComponent.RING_OUTER_SIZE * 2, 0),
                                                   FlatHexaOrientation.INSTANCE);

    public encoder: MoveEncoder<YinshMove> = YinshMove.encoder;

    public scores: number[] = [0, 0];

    private constructedState: YinshGameState;

    private movePhase: 'INITIAL_CAPTURE_SELECT_FIRST' | 'INITIAL_CAPTURE_SELECT_LAST' | 'INITIAL_CAPTURE_SELECT_RING' | 'MOVE_START' | 'MOVE_END' | 'FINAL_CAPTURE_SELECT_FIRST' | 'FINAL_CAPTURE_SELECT_LAST' | 'FINAL_CAPTURE_SELECT_RING'
        = 'MOVE_START';

    private moveStart: MGPOptional<Coord> = MGPOptional.empty();
    private moveEnd: MGPOptional<Coord> = MGPOptional.empty();
    private currentCapture: MGPOptional<YinshCapture> = MGPOptional.empty();
    private initialCaptures: YinshCapture[] = [];
    private finalCaptures: YinshCapture[] = [];

    private possibleCaptures: YinshCapture[] = [];

    private lastMoveCaptured: Coord[] = [];
    private lastMoveMoved: Coord[] = [];

    public viewInfo: ViewInfo = {
        caseInfo: [],
        selectableCoords: [],
        selectedCoords: [],
        markerSize: YinshComponent.MARKER_SIZE,
        ringOuterSize: YinshComponent.RING_OUTER_SIZE,
        ringMidSize: YinshComponent.RING_MID_SIZE,
        ringInnerSize: YinshComponent.RING_INNER_SIZE,
        sideRings: [5, 5],
        sideRingClass: ['player0-stroke', 'player1-stroke'],
    };

    constructor(messageDisplayer: MessageDisplayer) {
        super(messageDisplayer);
        this.availableMinimaxes = [
            new YinshMinimax(this.rules, 'YinshMinimax'),
        ];
        this.showScore = true;
        this.constructedState = this.rules.node.gamePartSlice;
        this.constructedState.hexaBoard.allCoords().forEach((coord: Coord): void => {
            if (this.viewInfo.caseInfo[coord.y] == null) {
                this.viewInfo.caseInfo[coord.y] = [];
            }
            this.viewInfo.caseInfo[coord.y][coord.x] = {
                coord,
                coordinates: this.getHexaCoordsAt(coord),
                center: this.getCenterAt(coord),
                caseClasses: [],
                markerClasses: [],
                ringClasses: [],
                isMarker: false,
                isRing: false,
                removedClass: '',
            };
        });
    }
    public updateBoard(): void {
        const state: YinshGameState = this.rules.node.gamePartSlice;
        this.board = state.board;

        this.cancelMoveAttempt();
        this.updateViewInfo();
    }
    public updateViewInfo(): void {
        this.constructedState.hexaBoard.allCoords().forEach((coord: Coord): void => {
            this.viewInfo.caseInfo[coord.y][coord.x].caseClasses = this.getCaseClasses(coord);
            const piece: YinshPiece = this.constructedState.hexaBoard.getAt(coord);
            this.viewInfo.caseInfo[coord.y][coord.x].removedClass = '';
            this.setRingInfo(coord, piece);
            this.setMarkerInfo(coord, piece);
        });
        for (const player of [Player.ZERO, Player.ONE]) {
            this.viewInfo.sideRings[player.value] = this.constructedState.sideRings[player.value];
        }
        if (this.currentCapture.isPresent()) {
            this.markCurrentCapture(this.currentCapture.get());
        }
        for (const capture of this.initialCaptures) {
            this.markCurrentCapture(capture);
        }
        for (const capture of this.finalCaptures) {
            this.markCurrentCapture(capture);
        }

        switch (this.movePhase) {
            case 'INITIAL_CAPTURE_SELECT_FIRST':
            case 'INITIAL_CAPTURE_SELECT_LAST':
            case 'FINAL_CAPTURE_SELECT_FIRST':
            case 'FINAL_CAPTURE_SELECT_LAST':
                this.viewInfo.selectableCoords = [];
                for (const capture of this.possibleCaptures) {
                    for (const coord of capture.capturedCases) {
                        this.viewInfo.selectableCoords.push(coord);
                    }
                }
                break;
            case 'INITIAL_CAPTURE_SELECT_RING':
            case 'FINAL_CAPTURE_SELECT_RING':
                this.viewInfo.selectableCoords =
                    this.constructedState.hexaBoard.getRingCoords(this.constructedState.getCurrentPlayer());
                break;
            case 'MOVE_START':
                this.viewInfo.selectableCoords =
                    this.constructedState.hexaBoard.getRingCoords(this.constructedState.getCurrentPlayer());
                break;
            default:
                this.viewInfo.selectableCoords = [];
        }
    }
    private getCaseClasses(coord: Coord): string[] {
        if (this.lastMoveCaptured.some((c: Coord) => c.equals(coord))) {
            return ['captured'];
        } else if (this.lastMoveMoved.some((c: Coord) => c.equals(coord))) {
            return ['moved'];
        } else if (coord.equals(this.moveStart.getOrNull())) {
            return ['moved'];
        } else if (coord.equals(this.moveEnd.getOrNull())) {
            return ['moved'];
        } else if (this.initialCaptures.some((c: YinshCapture) => c.contains(coord) || c.ringTaken.equals(coord))) {
            return ['selected'];
        } else if (this.finalCaptures.some((c: YinshCapture) => c.contains(coord) || c.ringTaken.equals(coord))) {
            return ['selected'];
        } else {
            return [];
        }
    }
    private setRingInfo(coord: Coord, piece: YinshPiece): void {
        if (piece.isRing) {
            const playerClass: string = this.getPlayerClass(piece.player);
            this.viewInfo.caseInfo[coord.y][coord.x].isRing = true;
            this.viewInfo.caseInfo[coord.y][coord.x].ringClasses = [playerClass + '-stroke'];
        } else {
            this.viewInfo.caseInfo[coord.y][coord.x].isRing = false;
            this.viewInfo.caseInfo[coord.y][coord.x].ringClasses = [];
        }
    }
    private setMarkerInfo(coord: Coord, piece: YinshPiece): void {
        this.viewInfo.caseInfo[coord.y][coord.x].isMarker = false;
        this.viewInfo.caseInfo[coord.y][coord.x].markerClasses = [];
        if (piece !== YinshPiece.EMPTY) {
            const containsMarker: boolean = !piece.isRing ||
                (piece.isRing && coord.equals(this.moveStart.getOrNull()));
            if (containsMarker) {
                const playerClass: string = this.getPlayerClass(piece.player);
                this.viewInfo.caseInfo[coord.y][coord.x].isMarker = true;
                this.viewInfo.caseInfo[coord.y][coord.x].markerClasses = [playerClass];
            }
        }
    }
    public cancelMoveAttempt(): void {
        this.constructedState = this.rules.node.gamePartSlice;
        this.showLastMove();

        this.possibleCaptures = [];
        this.initialCaptures = [];
        this.finalCaptures = [];
        this.viewInfo.selectedCoords = [];
        this.lastMoveCaptured = [];
        this.lastMoveMoved = [];
        this.currentCapture = MGPOptional.empty();
        this.moveStart = MGPOptional.empty();
        this.moveEnd = MGPOptional.empty();
        this.moveToInitialCaptureOrMovePhase();
    }
    private showLastMove(): void {
        const move: YinshMove = this.rules.node.move;
        if (move !== null) {
            if (move.isInitialPlacement()) {
                this.lastMoveMoved = [move.start];
            } else {
                this.lastMoveMoved = [];
                const dir: HexaDirection = HexaDirection.factory.fromMove(move.start, move.end.get()).get();
                for (let cur: Coord = move.start; !cur.equals(move.end.get()); cur = cur.getNext(dir)) {
                    if (this.constructedState.hexaBoard.getAt(cur) !== YinshPiece.EMPTY) {
                        this.lastMoveMoved.push(cur);
                    }
                    this.lastMoveMoved.push(move.end.get());
                }
                move.initialCaptures.forEach((c: YinshCapture) => this.markCapture(c));
                move.finalCaptures.forEach((c: YinshCapture) => this.markCapture(c));
            }
        }
    }
    private markCapture(capture: YinshCapture): void {
        capture.forEach((coord: Coord) => {
            this.lastMoveCaptured.push(coord);
        });
        this.lastMoveCaptured.push(capture.ringTaken);
    }
    private moveToInitialCaptureOrMovePhase(): MGPValidation {
        this.possibleCaptures = this.rules.getPossibleCaptures(this.constructedState);
        if (this.possibleCaptures.length === 0) {
            this.movePhase = 'MOVE_START';
        } else {
            this.movePhase = 'INITIAL_CAPTURE_SELECT_FIRST';
        }
        this.updateViewInfo();
        return MGPValidation.SUCCESS;
    }
    public async onClick(coord: Coord): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#click_' + coord.x + '_' + coord.y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        switch (this.movePhase) {
            case 'INITIAL_CAPTURE_SELECT_FIRST':
            case 'FINAL_CAPTURE_SELECT_FIRST':
                return this.selectCaptureFirstCoord(coord);
            case 'INITIAL_CAPTURE_SELECT_LAST':
            case 'FINAL_CAPTURE_SELECT_LAST':
                return this.selectCaptureLastCoord(coord);
            case 'INITIAL_CAPTURE_SELECT_RING':
            case 'FINAL_CAPTURE_SELECT_RING':
                return this.selectRing(coord);
            case 'MOVE_START':
                return this.selectMoveStart(coord);
            case 'MOVE_END':
                return this.selectMoveEnd(coord);
        }
    }
    private async selectCaptureFirstCoord(coord: Coord): Promise<MGPValidation> {
        const captures: YinshCapture[] = [];
        this.possibleCaptures.forEach((candidate: YinshCapture) => {
            if (candidate.contains(coord)) {
                captures.push(candidate);
            }
        });
        if (captures.length > 1) {
            this.viewInfo.selectedCoords.push(coord);
            this.moveToCaptureSelectLast(captures);
        } else if (captures.length === 0) {
            return this.cancelMove(YinshFailure.NOT_PART_OF_CAPTURE);
        } else {
            this.selectCapture(captures[0]);
        }
        return MGPValidation.SUCCESS;
    }
    private moveToCaptureSelectLast(possibleCaptures: YinshCapture[]): void {
        this.viewInfo.selectableCoords = [];
        for (const capture of possibleCaptures) {
            for (const coord of capture.capturedCases) {
                this.viewInfo.selectableCoords.push(coord);
            }
        }
        switch (this.movePhase) {
            case 'INITIAL_CAPTURE_SELECT_FIRST':
                this.movePhase = 'INITIAL_CAPTURE_SELECT_LAST';
                break;
            case 'FINAL_CAPTURE_SELECT_FIRST':
                this.movePhase = 'FINAL_CAPTURE_SELECT_LAST';
                break;
        }
    }
    private async selectCaptureLastCoord(coord: Coord): Promise<MGPValidation> {
        const captures: YinshCapture[] = [];
        this.possibleCaptures.forEach((candidate: YinshCapture) => {
            if (candidate.contains(coord)) {
                captures.push(candidate);
            }
        });
        if (captures.length === 0) {
            return this.cancelMove(YinshFailure.NOT_PART_OF_CAPTURE);
        }
        assert(captures.length === 1, 'only one capture should remain, otherwise there would be two identical captures');
        this.selectCapture(captures[0]);
    }
    private selectCapture(capture: YinshCapture) {
        this.currentCapture = MGPOptional.of(capture);
        this.constructedState = new YinshGameState(
            this.rules.applyCaptureWithoutTakingRing(this.constructedState, capture),
            this.constructedState.sideRings,
            this.constructedState.turn);

        switch (this.movePhase) {
            case 'INITIAL_CAPTURE_SELECT_FIRST':
            case 'INITIAL_CAPTURE_SELECT_LAST':
                this.movePhase = 'INITIAL_CAPTURE_SELECT_RING';
                break;
            case 'FINAL_CAPTURE_SELECT_FIRST':
            case 'FINAL_CAPTURE_SELECT_LAST':
                this.movePhase = 'FINAL_CAPTURE_SELECT_RING';
                break;
        }
        this.updateViewInfo();
        return MGPValidation.SUCCESS;
    }
    private markCurrentCapture(capture: YinshCapture): void {
        for (const coord of capture.capturedCases) {
            this.viewInfo.selectedCoords.push(coord);
            this.viewInfo.caseInfo[coord.y][coord.x].removedClass = 'transparent';
            this.setMarkerInfo(coord, YinshPiece.MARKERS[this.rules.node.gamePartSlice.getCurrentPlayer().value]);
        }
        if (!capture.ringTaken.equals(new Coord(-1, -1))) {
            this.viewInfo.selectedCoords.push(capture.ringTaken);
            this.setRingInfo(capture.ringTaken,
                             YinshPiece.RINGS[this.rules.node.gamePartSlice.getCurrentPlayer().value]);
        }
    }

    private async selectRing(coord: Coord): Promise<MGPValidation> {
        const validity: MGPValidation = this.rules.ringSelectionValidity(this.constructedState, coord);
        if (validity.isFailure()) {
            return this.cancelMove(validity.getReason());
        }
        this.constructedState = this.rules.takeRing(this.constructedState, coord);
        const capture: YinshCapture = this.currentCapture.get().setRingTaken(coord);
        this.currentCapture = MGPOptional.empty();

        this.possibleCaptures = this.rules.getPossibleCaptures(this.constructedState);

        switch (this.movePhase) {
            case 'INITIAL_CAPTURE_SELECT_RING':
                this.initialCaptures.push(capture);
                if (this.possibleCaptures.length === 0) {
                    return this.moveToMovePhase();
                } else {
                    this.movePhase = 'INITIAL_CAPTURE_SELECT_FIRST';
                    this.updateViewInfo();
                    return MGPValidation.SUCCESS;
                }
            case 'FINAL_CAPTURE_SELECT_RING':
                this.finalCaptures.push(capture);
                if (this.possibleCaptures.length === 0) {
                    return this.tryMove();
                } else {
                    this.movePhase = 'FINAL_CAPTURE_SELECT_FIRST';
                    this.updateViewInfo();
                    return MGPValidation.SUCCESS;
                }
        }
    }
    private moveToMovePhase(): MGPValidation {
        this.movePhase = 'MOVE_START';
        this.updateViewInfo();
        return MGPValidation.SUCCESS;
    }
    private async tryMove(): Promise<MGPValidation> {
        const move: YinshMove = new YinshMove(this.initialCaptures,
                                              this.moveStart.get(),
                                              this.moveEnd,
                                              this.finalCaptures);
        const validity: MGPValidation = await this.chooseMove(move, this.rules.node.gamePartSlice, null, null);
        return validity;
    }
    private async selectMoveStart(coord: Coord): Promise<MGPValidation> {
        if (this.constructedState.isInitialPlacementPhase()) {
            const validity: MGPValidation = this.rules.initialPlacementValidity(this.constructedState, coord);
            if (validity.isFailure()) {
                return this.cancelMove(validity.getReason());
            }
            this.moveStart = MGPOptional.of(coord);
            return this.tryMove();
        } else {
            const validity: MGPValidation = this.rules.moveStartValidity(this.constructedState, coord);
            if (validity.isFailure()) {
                return this.cancelMove(validity.getReason());
            }
            this.moveStart = MGPOptional.of(coord);
            this.movePhase = 'MOVE_END';
            this.updateViewInfo();
        }
        return MGPValidation.SUCCESS;
    }
    private async selectMoveEnd(coord: Coord): Promise<MGPValidation> {
        const validity: MGPValidation = this.rules.moveValidity(this.constructedState, this.moveStart.get(), coord);
        if (validity.isFailure()) {
            return this.cancelMove(validity.getReason());
        }
        this.moveEnd = MGPOptional.of(coord);
        this.constructedState = this.rules.applyRingMoveAndFlip(this.constructedState, this.moveStart.get(), coord);
        this.updateViewInfo();
        return this.moveToFinalCapturePhaseOrTryMove();
    }
    private async moveToFinalCapturePhaseOrTryMove(): Promise<MGPValidation> {
        this.possibleCaptures = this.rules.getPossibleCaptures(this.constructedState);
        if (this.possibleCaptures.length === 0) {
            return this.tryMove();
        } else {
            this.movePhase = 'FINAL_CAPTURE_SELECT_FIRST';
            this.updateViewInfo();
        }
    }
}
