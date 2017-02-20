# node-jkpug
A pick Up Game bot for Jedi Knight (Academy and Outcast) with Discord and IRC frontends. 

## Commands
###!servers (gametype)
Prints a list of servers, their gametypes, and how many players are currently online that server. You can specify a second parameter for gametype (eg. !servers ctf), however it is not required. 

###!games
Prints a list of gametypes and how many players are queued in each

###!add (type)
Adds yourself to the queue for the specified gametype

###!remove (type)
Removes yourself from the queue for the specified gametype 


## Installation
To start, you're going to need your choice of linux server. I'll be using Ubuntu 14.04 in this.
You are going to need git, node/npm, and libicu-dev. 
First, we're going to update the system, install node (through PPA), and download some packages we're going to need.

    sudo apt-get update && apt-get upgrade -y
    sudo apt-get install curl git libicu-dev -y
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
    sudo apt-get install nodejs 
    sudo apt-get install build-essential

That was fun, wasn't it?

Now, we're going to download the repository and install it via NPM, feel free to rename the folder. This bot also requires a separate package, node-jkutils, so we're also going to install that. 

    git clone https://github.com/Razish/node-jkpug.git
    cd (folder name)
    (yep, I used sudo) sudo npm install Razish/node-jkutils
    sudo npm install 

Great, now the fun part is over and we get to do some stuff on discord.  
Hop on over to https://discordapp.com/developers/applications/ and make a new application/create it as a bot. You're going to need 3 things:  

1. Client ID  
2. Secret  
3. Token  



Rename the included sample.json.txt to config.json and at the top of the file put your ID/Secret/Token there and add your gametypes/servers. 
Once you're finished with that, you should be good to go!  
Let's invite the bot to your server. Simply replace BotID in the link below with your client ID from earlier that you got from the Discord site.  
    https://discordapp.com/oauth2/authorize?&client_id=BotID&scope=bot&permissions=67243008  
    

Go back to your directory of the bot and let's start it  
    (yep, sudo again!) sudo npm install 
    npm start run discord (also can use irc instead of discord, just replace "discord" with "irc") 
If you did everything properly, you should now see everyone chatting on your server  
**At the moment, the bot only reads from a channel called pug**, so create a new channel with that name. 
Try a few commands, and hopefully it works! 

To keep the bot running, I recommend using something like screen.

#### Note:
This is by no means a 100% complete guide and you should take security precautions into consideration as well. If you want to see the bot in action or just want to chat, you can join the JKCommunity discord at https://discord.gg/xjt5apT

