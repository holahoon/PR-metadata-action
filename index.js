// All of the logics of the action.yml
const core = require('@actions/core');
const github = require('@actions/github');
const main = async () => {
  try {
    /**
     * Fetch all the inputs that were provided to the action and store them in variables to use.
     */
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const pr_number = core.getInput('pr_number', { require: true });
    const token = core.getInput('token', { require: true });
    /**
     * Create an instance of Octokit which will use to call Github’s REST API endpoints.
     * Pass the token as an argument to the constructor. This token will be used to authenticate the requests.
     * https://octokit.github.io/rest.js/v18
     */
    const octokit = new github.getOctokit(token);
    /**
     * Fetch the list of files that were changes in the Pull Request and store them in a variable.
     * Use octokit.paginate() to automatically loop over all the pages of the results.
     * https://octokit.github.io/rest.js/v18#pulls-list-files
     */
    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pr_number,
    });
    /**
     * Contains the sum of all the additions, deletions, and changes in all the files in the Pull Requests.
     */
    let diffData = {
      additions: 0,
      deletions: 0,
      changes: 0,
    };
    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions;
      acc.deletions += file.deletions;
      acc.changes += file.changes;
      return acc;
    }, diffData);
    /**
     * Loop over all the files changed in the PR and add labels according to file types.
     */
    for (const file of changedFiles) {
      /**
       * Add labels according to file types.
       */
      const fileExtension = file.filename.split('.').pop();
      switch (fileExtension) {
        case 'md':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['markdown'],
          });
        case 'js':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['javascript'],
          });
        case 'yml':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['yaml'],
          });
        case 'yaml':
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr_number,
            labels: ['yaml'],
          });
      }
    }
    /**
     * Create a comment on the PR with the information compiled from the list of changed files.
     */
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
            Pull request #${pr_number} has been updated with: \n
            - ${diffData.changes} changes \n
            - ${diffData.additions} additions \n
            - ${diffData.deletions} deletions \n
        `,
    });
  } catch (err) {
    core.setFailed(err.message);
  }
};
/**
 * Call the main function to run the action
 */
main();
