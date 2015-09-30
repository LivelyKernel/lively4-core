

# Some nice git snippets

	git remote add onsetsu git://github.com/onsetsu/lively4-coren
	git fetch onsetsu 
	git merge onsetsu/master 
	git diff
	git stash
	git merge onsetsu/master 
	git stash apply
	git diff
	git lg
	git log
	git log --graph

# Webwerkstatt like auto commit

	git pull --no-edit; git commit -m "draft ace editor" .; git push
