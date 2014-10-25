#!/bin/bash 

while :
do
	/usr/sbin/ioreg -c IOHIDSystem | /usr/bin/awk '/HIDIdleTime/ {print int($NF/1000000000); exit}'
	sleep 2
done