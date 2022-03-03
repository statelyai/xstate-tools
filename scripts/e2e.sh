#!/usr/bin/env bash

export CODE_TESTS_PATH="$(pwd)/apps/extension/client/out/test"
export CODE_TESTS_WORKSPACE="$(pwd)/apps/extension/client/testFixture"

node "$(pwd)/apps/extension/client/out/test/runTest"