#!/bin/sh
# Wayland nativ nutzen (Grafiktablett mit Druck), sonst X11
exec /usr/bin/electron43 --ozone-platform-hint=auto --enable-features=WaylandWindowDecorations /usr/lib/unfug "$@"
