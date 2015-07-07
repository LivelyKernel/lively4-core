set -x
case "$TYPE" in
    Lively)
	bin/lively_build.sh
	bin/lively_jsdoc.sh
	exec bin/lively_test.sh
	;;
    Standalone)
	exec bin/node_test.sh
	;;
    lint)
	exec bin/lint.sh
	;;
esac
