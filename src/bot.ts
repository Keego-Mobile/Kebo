import { Context, Probot } from 'probot';
import { Chat } from './chat.js';
import { ChatGPTAuthTokenService } from "chat-gpt-authenticator";

const OPENAI_API_KEY = 'OPENAI_API_KEY';
const MAX_PATCH_COUNT = 4000;

export const robot = (app: Probot) => {
  const loadChat = async (context: Context) => {
    if (process.env.OPENAI_USERNAME && process.env.OPENAI_PASSWORD) {
      const chatGptAuthTokenService = new ChatGPTAuthTokenService(
        process.env.OPENAI_USERNAME,
        process.env.OPENAI_PASSWORD
      );

      const accesstoken = await chatGptAuthTokenService.getToken();
      const defaultChat = new Chat(accesstoken, true);
      try {
        await defaultChat.testModel()
        console.log("Using Web version")
        return defaultChat
      } catch {
        console.log("Using OpenAI version")
      }
    }


    if (process.env.OPENAI_API_KEY) {
      return new Chat(process.env.OPENAI_API_KEY);
    }

    const repo = context.repo();

    try {
      try {

      } catch {

      }

      const { data } = (await context.octokit.request(
        'GET /repos/{owner}/{repo}/actions/variables/{name}',
        {
          owner: repo.owner,
          repo: repo.repo,
          name: OPENAI_API_KEY,
        }
      )) as any;

      if (!data?.value) {
        return null;
      }

      return new Chat(data.value);
    } catch {
      await context.octokit.issues.createComment({
        repo: repo.repo,
        owner: repo.owner,
        issue_number: context.pullRequest().pull_number,
        body: `Seems you are using me but didn't get OPENAI_API_KEY seted in Variables/Secrets for this repo. you could follow [readme](https://github.com/anc95/ChatGPT-CodeReview) for more information`,
      });
      return null;
    }
  };

  app.on(
    ['pull_request.opened', 'pull_request.synchronize', 'pull_request.reopened'],
    async (context) => {
      const repo = context.repo();
      const chat = await loadChat(context);

      if (!chat) {
        console.log("- No Chat Client Found!")
        return 'no chat';
      }

      const pull_request = context.payload.pull_request;

      if (
        pull_request.state === 'closed' ||
        pull_request.locked ||
        pull_request.draft
      ) {
        return 'invalid event paylod';
      }

      const data = await context.octokit.repos.compareCommits({
        owner: repo.owner,
        repo: repo.repo,
        base: context.payload.pull_request.base.sha,
        head: context.payload.pull_request.head.sha,
      });

      let { files: changedFiles, commits } = data.data;

      console.log("- changedFiles from base: ", changedFiles)

      if (context.payload.action === 'synchronize') {
        if (commits.length >= 2) {
          const {
            data: { files },
          } = await context.octokit.repos.compareCommits({
            owner: repo.owner,
            repo: repo.repo,
            base: commits[commits.length - 2].sha,
            head: commits[commits.length - 1].sha,
          });

          changedFiles = files

          console.log("- changedFiles from last commits: ", changedFiles)
          // const filesNames = files?.map((file) => file.filename) || [];
          // changedFiles = changedFiles?.filter((file) =>
          //   filesNames.includes(file.filename)
          // );
        }
      }

      if (!changedFiles?.length) {
        console.log("- No change");
        return 'no change';
      }

      console.time('gpt cost');

      for (let i = 0; i < changedFiles.length; i++) {
        const file = changedFiles[i];
        const patch = file.patch || '';

        if (!patch || patch.length > MAX_PATCH_COUNT) {
          continue;
        }
        const res = await chat?.codeReview(patch);

        if (!!res) {
          await context.octokit.pulls.createReviewComment({
            repo: repo.repo,
            owner: repo.owner,
            pull_number: context.pullRequest().pull_number,
            commit_id: commits[commits.length - 1].sha,
            path: file.filename,
            body: res,
            position: patch.split('\n').length - 1,
          });
        }
      }

      console.timeEnd('gpt cost');
      console.info('suceess reviewed', context.payload.pull_request.html_url);

      return 'success';
    }
  );
};
