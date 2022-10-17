npm run make
path="out/mc-server-managment-win32-x64"
app=$path"/resources/app"

del=(".gitignore" "cache.json" "config.json" "make.sh" "server_list.json" "TODO.todo")

for i in ${del[@]}; do
    rm -r $app/$i
done

cp ./config.json $path
