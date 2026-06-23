import os
open("hello.txt","w",encoding="utf-8").write("Built by Ocean autonomously`n")
print(open("hello.txt","r",encoding="utf-8").read().strip())
