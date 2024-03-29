import firebase from 'firebase';
import { MGPResult, Part } from './icurrentpart';

export class PartMocks {
    public static readonly INITIAL: Part = new Part({
        typeGame: 'Quarto',
        playerZero: 'creator',
        turn: -1,
        result: MGPResult.UNACHIEVED.value,
        listMoves: [],
    });

    public static readonly STARTING: Part = new Part({
        typeGame: 'Quarto',
        playerZero: 'creator',
        turn: 0,
        listMoves: [],
        result: MGPResult.UNACHIEVED.value,
        playerOne: 'firstCandidate',
        remainingMsForOne: 1800 * 1000,
        remainingMsForZero: 1800 * 1000,
        beginning: firebase.firestore.FieldValue.serverTimestamp(),
    });
}
