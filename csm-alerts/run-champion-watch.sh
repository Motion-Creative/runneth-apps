#!/bin/bash
# Configure: set CSM_EMAIL to the book you want to monitor
CSM_EMAIL="${CSM_EMAIL:-your-email@motionapp.com}"
cd "$(dirname "$0")"
node champion-watch.mjs --csm-email "$CSM_EMAIL"
