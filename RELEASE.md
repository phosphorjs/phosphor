Release instructions for Phosphor

Check for releases since the last published version to determine appropriate
patch/minor/major version changes.
If a dependent package moves by minor/major, then that package needs to jump
minor/major as well.


```bash
git clean -dfx
yarn
yarn run version
yarn run publish
```
