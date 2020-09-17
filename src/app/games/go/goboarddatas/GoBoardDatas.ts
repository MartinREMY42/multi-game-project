import { GroupInfos } from "../gorules/GoRules";
import { GoPiece, GoPartSlice } from "../GoPartSlice";
import { ArrayUtils } from "src/app/collectionlib/arrayutils/ArrayUtils";
import { Coord } from "src/app/jscaip/coord/Coord";
import { GroupDatas } from "../groupdatas/GroupDatas";

export class GoBoardDatas {

    private constructor(
        readonly groupIndexes: ReadonlyArray<ReadonlyArray<number>>,
        readonly groups: ReadonlyArray<GroupInfos>
    ) { }
    public static ofGoPiece(board: GoPiece[][]): GoBoardDatas {
        let groupIndexes: number[][] = ArrayUtils.createBiArray<number>(GoPartSlice.WIDTH, GoPartSlice.HEIGHT, -1);
        let groupsDatas: GroupDatas[] = [];
        for (let y: number = 0; y < GoPartSlice.HEIGHT; y++) {
            for (let x: number = 0; x < GoPartSlice.WIDTH; x++) {
                if (groupIndexes[y][x] === -1) {
                    const newGroupEntryPoint: Coord = new Coord(x, y);
                    const newGroupDatas: GroupDatas = GroupDatas.getGroupDatas(newGroupEntryPoint, board);
                    const groupCoords: Coord[] = newGroupDatas.getCoords();
                    const newGroupIndex = groupsDatas.length;
                    for (let coord of groupCoords) {
                        groupIndexes[coord.y][coord.x] = newGroupIndex;
                    }
                    groupsDatas.push(newGroupDatas);
                }
            }
        }
        const groupsInfos: GroupInfos[] = [];
        for (let groupDatas of groupsDatas) {
            const coords: Coord[] = groupDatas.getCoords();
            const neighboorsEP: Coord[] = groupDatas.getNeighboorsEntryPoint();
            const groupInfos: GroupInfos = new GroupInfos(coords, neighboorsEP);
            groupsInfos.push(groupInfos);
        }
        return new GoBoardDatas(groupIndexes, groupsInfos);
    }
    public static ofBoard(board: number[][]): GoBoardDatas {
        const pieceBoard: GoPiece[][] = GoPartSlice.mapNumberBoard(board);
        return GoBoardDatas.ofGoPiece(pieceBoard);
    }
}