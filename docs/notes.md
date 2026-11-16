docker notes
============

the main thing to figure out was where to save the deadlines so they stay after the container gets removed

the api writes the json file in the data folder and docker mounts a named volume there so a new container can read the same file

git notes
=========

keeping the docker setup and the docs in separate commits makes it easier to see what changed and check it in the pull request
