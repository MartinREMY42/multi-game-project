import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirstPlayer, IJoiner, IJoinerId, PartStatus, PartType } from '../domain/ijoiner';
import { JoinerDAO } from '../dao/JoinerDAO';
import { assert, display } from 'src/app/utils/utils';
import { ArrayUtils } from '../utils/ArrayUtils';
import { MGPOptional } from '../utils/MGPOptional';

@Injectable({
    providedIn: 'root',
})
export class JoinerService {
    public static VERBOSE: boolean = false;

    private observedJoinerId: string;

    constructor(private joinerDao: JoinerDAO) {
        display(JoinerService.VERBOSE, 'JoinerService.constructor');
    }
    public observe(joinerId: string): Observable<IJoinerId> {
        this.observedJoinerId = joinerId;
        return this.joinerDao.getObsById(joinerId);
    }
    public async createInitialJoiner(creatorName: string, joinerId: string): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.createInitialJoiner(' + creatorName + ', ' + joinerId + ')');

        const newJoiner: IJoiner = {
            candidates: [],
            chosenPlayer: null,
            firstPlayer: FirstPlayer.RANDOM.value,
            partType: PartType.STANDARD.value,
            partStatus: PartStatus.PART_CREATED.value,
            maximalMoveDuration: PartType.NORMAL_MOVE_DURATION,
            totalPartDuration: PartType.NORMAL_PART_DURATION,
            creator: creatorName,
        };
        return this.set(joinerId, newJoiner);
    }
    public async joinGame(partId: string, userName: string): Promise<boolean> {
        display(JoinerService.VERBOSE, 'JoinerService.joinGame(' + partId + ', ' + userName + ')');

        const joiner: MGPOptional<IJoiner> = await this.joinerDao.read(partId);
        if (joiner.isAbsent()) {
            return false;
        }
        const joinerList: string[] = ArrayUtils.copyImmutableArray(joiner.get().candidates);
        if (joinerList.includes(userName)) {
            throw new Error('JoinerService.joinGame was called by a user already in the game');
        } else if (userName === joiner.get().creator) {
            return true;
        } else {
            joinerList[joinerList.length] = userName;
            await this.joinerDao.update(partId, { candidates: joinerList });
            return true;
        }
    }
    public async cancelJoining(userName: string): Promise<void> {
        display(JoinerService.VERBOSE,
                'JoinerService.cancelJoining(' + userName + '); this.observedJoinerId = ' + this.observedJoinerId);

        if (this.observedJoinerId == null) {
            throw new Error('cannot cancel joining when not observing a joiner');
        }
        const joinerOpt: MGPOptional<IJoiner> = await this.joinerDao.read(this.observedJoinerId);
        if (joinerOpt.isAbsent()) {
            // The part does not exist, so we can consider that we succesfully cancelled joining
            return;
        } else {
            const joiner: IJoiner = joinerOpt.get();
            const candidates: string[] = ArrayUtils.copyImmutableArray(joiner.candidates);
            const indexLeaver: number = candidates.indexOf(userName);
            let chosenPlayer: string | null = joiner.chosenPlayer;
            let partStatus: number = joiner.partStatus;
            candidates.splice(indexLeaver, 1); // remove player from candidates list
            if (chosenPlayer === userName) {
                // if the chosenPlayer leave, we're back to initial part creation
                chosenPlayer = null;
                partStatus = PartStatus.PART_CREATED.value;
            } else if (indexLeaver === -1) {
                throw new Error('someone that was nor candidate nor chosenPlayer just left the chat: ' + userName);
            }
            const modification: Partial<IJoiner> = {
                chosenPlayer,
                partStatus,
                candidates,
            };
            return this.joinerDao.update(this.observedJoinerId, modification);
        }
    }
    public async updateCandidates(candidates: string[]): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.reviewConfig');
        assert(this.observedJoinerId != null, 'JoinerService is not observing a joiner');
        const modification: Partial<IJoiner> = { candidates };
        return this.joinerDao.update(this.observedJoinerId, modification);
    }
    public async deleteJoiner(): Promise<void> {
        display(JoinerService.VERBOSE,
                'JoinerService.deleteJoiner(); this.observedJoinerId = ' + this.observedJoinerId);
        assert(this.observedJoinerId != null, 'JoinerService is not observing a joiner');
        return this.joinerDao.delete(this.observedJoinerId);
    }
    public async proposeConfig(chosenPlayer: string,
                               partType: PartType,
                               maximalMoveDuration: number,
                               firstPlayer: FirstPlayer,
                               totalPartDuration: number)
    : Promise<void>
    {
        display(JoinerService.VERBOSE,
                { joinerService_proposeConfig: { maximalMoveDuration, firstPlayer, totalPartDuration } });
        display(JoinerService.VERBOSE, 'this.followedJoinerId: ' + this.observedJoinerId);
        assert(this.observedJoinerId != null, 'JoinerService is not observing a joiner');

        return this.joinerDao.update(this.observedJoinerId, {
            partStatus: PartStatus.CONFIG_PROPOSED.value,
            chosenPlayer,
            partType: partType.value,
            maximalMoveDuration,
            totalPartDuration,
            firstPlayer: firstPlayer.value,
        });
    }
    public setChosenPlayer(player: string): Promise<void> {
        display(JoinerService.VERBOSE, `JoinerService.setChosenPlayer(${player})`);
        assert(this.observedJoinerId != null, 'JoinerService is not observing a joiner');

        return this.joinerDao.update(this.observedJoinerId, {
            chosenPlayer: player,
        });
    }
    public async reviewConfig(): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.reviewConfig');
        assert(this.observedJoinerId != null, 'JoinerService is not observing a joiner');

        return this.joinerDao.update(this.observedJoinerId, {
            partStatus: PartStatus.PART_CREATED.value,
        });
    }
    public async reviewConfigRemoveChosenPlayerAndUpdateCandidates(candidates: string[]): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.reviewConfig');
        assert(this.observedJoinerId != null, 'JoinerService is not observing a joiner');

        return this.joinerDao.update(this.observedJoinerId, {
            partStatus: PartStatus.PART_CREATED.value,
            chosenPlayer: null,
            candidates,
        });
    }
    public acceptConfig(): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.acceptConfig');
        assert(this.observedJoinerId != null, 'JoinerService is not observing a joiner');

        return this.joinerDao.update(this.observedJoinerId, { partStatus: PartStatus.PART_STARTED.value });
    }
    public async createJoiner(joiner: IJoiner): Promise<string> {
        display(JoinerService.VERBOSE, 'JoinerService.create(' + JSON.stringify(joiner) + ')');

        return this.joinerDao.create(joiner);
    }
    public async readJoinerById(partId: string): Promise<IJoiner> {
        display(JoinerService.VERBOSE, 'JoinerService.readJoinerById(' + partId + ')');

        return (await this.joinerDao.read(partId)).get();
    }
    public async set(partId: string, joiner: IJoiner): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.set(' + partId + ', ' + JSON.stringify(joiner) + ')');

        return this.joinerDao.set(partId, joiner);
    }
    public async updateJoinerById(partId: string, update: Partial<IJoiner>): Promise<void> {
        display(JoinerService.VERBOSE, { joinerService_updateJoinerById: { partId, update } });

        return this.joinerDao.update(partId, update);
    }
}
