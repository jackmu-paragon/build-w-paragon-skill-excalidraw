#!/bin/sh

# Set Session Name
SESSION="excalidraw-fork"
SESSIONEXISTS=$(tmux list-sessions | grep $SESSION)

if [ "$SESSIONEXISTS" = "" ]
then
    tmux new-session -d -s $SESSION

    tmux rename-window -t 0 'nvim-win'
    tmux send-keys -t 'nvim' 'nvim' C-m

    tmux new-window -t $SESSION:1 -n 'start-frontend'
    tmux send-keys -t 'start-frontend' 'yarn start' C-m
fi

# Attach Session, on the Main window
tmux attach-session -t $SESSION:0
