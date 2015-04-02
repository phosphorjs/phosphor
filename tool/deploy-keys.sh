ORG=Carreau
REP=phosphor
mkdir .travis
ssh-keygen -t rsa -b 2048 -f .travis/id_rsa_travis_${ORG}_${REP} -N ''
travis encrypt-file -r ${ORG}/${REP} .travis/id_rsa_travis_${ORG}_${REP}
mv id_rsa_travis_${ORG}_${REP}.enc .travis/id_rsa_travis_${ORG}_${REP}.enc 
rm .travis/id_rsa_travis_${ORG}_${REP}
echo "please note carefully the line that was give to you above"
echo "add it to your .travis.yml file, folowo by the following":
echo "======================================="
echo "eval $(ssh-agent -s)"
echo "chmod 600 .travis/travis_id_rsa_2048"
echo "ssh-add .travis/travis_id_rsa_2048"
echo "==="
echo "dont't  forget it will only work while pushing through ssh !"
echo "to git@github.com:${ORG}/${REP}.git"
echo "======================================="
echo "adding public and encrypted key to git repo, please commit"
echo "private key has already been erased"
git add .travis/id_rsa_travis_${ORG}_${REP}.enc
git add .travis/id_rsa_travis_${ORG}_${REP}.pub
echo " authorize this key on https://github.com/${ORG}/${REP}/settings/keys"
echo "==="
cat .travis/id_rsa_travis_${ORG}_${REP}.pub
echo "======================================="

