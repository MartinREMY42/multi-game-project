import { MGPMap } from "src/app/collectionlib/mgpmap/MGPMap";
import { MGPStr } from "src/app/collectionlib/mgpstr/MGPStr";
import { ObservableSubject } from "src/app/collectionlib/ObservableSubject";
import { FirebaseFirestoreDAOMock } from "../firebasefirestoredao/FirebaseFirestoreDAOMock";
import { IChat, PIChat, IChatId } from "src/app/domain/ichat";

interface ChatOS extends ObservableSubject<IChatId> {}

export class ChatDAOMock extends FirebaseFirestoreDAOMock<IChat, PIChat> {

    public static VERBOSE: boolean = false;

    private static chatDB: MGPMap<MGPStr, ChatOS>;

    public constructor() {
        super("ChatDAOMock", ChatDAOMock.VERBOSE);
        if (this.VERBOSE) console.log("ChatDAOMock.constructor");
    }
    public getStaticDB(): MGPMap<MGPStr, ChatOS> {
        return ChatDAOMock.chatDB;
    }
    public resetStaticDB() {
        ChatDAOMock.chatDB = new MGPMap();
    }
}