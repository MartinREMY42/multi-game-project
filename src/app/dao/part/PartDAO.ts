import { FirebaseFirestoreDAO } from "../firebasefirestoredao/FirebaseFirestoreDAO";
import { ICurrentPart, PICurrentPart, ICurrentPartId } from "../../domain/icurrentpart";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Injectable } from "@angular/core";
import { FirebaseCollectionObserver } from "../FirebaseCollectionObserver";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn: 'root'
})
export class PartDAO extends FirebaseFirestoreDAO<ICurrentPart, PICurrentPart> {

    public static VERBOSE: boolean = false;

    constructor(protected afs: AngularFirestore) {
        super("parties", afs);
        if (environment.test) throw new Error("NO PART DAO IN TEST");
        if(PartDAO.VERBOSE) console.log("PartDAO.constructor");
    }
    public observeActivesParts(callback: FirebaseCollectionObserver<ICurrentPart>): () => void {
        return this.observingWhere("result", "==", 5, callback);
    }
}