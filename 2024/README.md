# Christmas Tree Light Controller

### Demo Video
[![Christmas Tree Light Controller Demo](https://img.youtube.com/vi/4Ud3u6gmLVs/0.jpg)](https://www.youtube.com/watch?v=4Ud3u6gmLVs&ab_channel=BennettOlsen)



## Introduction
For Christmas 2023, I built a webapp to control the lights on my Christmas Tree.

I used a Raspberry Pi to control 550 LED lights on the tree. To command the Raspberry Pi, I used a Flask server to host the backend API. This web app sends commands to the Flask server to run programs that control the lights.

# Setup
<img src="Assets/readme/webapp_diagram.svg" alt="Home Page" width="600"/>

#### Webapp
The webapp acts as a user interface that allows the user to control the current effect on the tree.

#### Flask Server
The Flask server is run from the Raspberry Pi and contains several API endpoints that control the effects on the tree.


# Features
## Effects Page
<img src="Assets/readme/homepage.png" alt="Home Page" width="300"/>

The homepage of my webapp contains several buttons that run preprogrammed effects on my christmas tree. 

At the top of the app is a power button which turns off all lights on the tree.

##### Flask server provides the current state of the tree
When a button is selected, the color changes to light blue to indicate that it is currently selected. When loading the app there is a call made to the flask server which returns the current status of the tree. This status update allows for the app to always display what the current effect is on the tree even if a different user opens up the app.

## Color Wheel
<img src="Assets/readme/colorwheel.png" alt="Color Wheel" width="300"/>

The color of the tree can be set directly using a color wheel. The color wheel specifies the hue, while the slider below adjusts the brightness of the tree. The best results are achieved when the brightness is high, as a tree with no brightness means all the LEDs are turned off.

## Pokemon Page
<img src="Assets/readme/pokemon.png" alt="Pokemon Page" width="300"/>

One of my favorite features of the webapp is the ability to set the tree's color based off of the color of a pokemon. 

This effect is achieved by taking the pokemon's three most prominent colors and setting the bulbs on the tree to feature those three colors.

The "?" button in the top right corner of the page randomly selects a pokemon and displays it to the user to select.


# Reflection
Building this Christmas tree light controller was a rewarding experience that combined my interests in web development, hardware programming, and creative lighting design. Throughout the project, I faced several challenges and gained valuable skills.

## Challenges
#### 1. Hardware Integration
One of the primary challenges was interfacing the Raspberry Pi with the Neopixel LEDs. Ensuring that the LEDs responded correctly to commands and troubleshooting hardware issues required a deep understanding of the hardware-software interaction.

#### 2. Flask Server Configuration
Setting up the Flask server to handle multiple API endpoints securely and efficiently was another significant hurdle. It was also a challenge to ensure that the API endpoints were secure by requiring authentication to be included in the API calls in order to be successful.

#### 3. Real-time Updates: 
Implementing real-time updates in the web app to reflect the current state of the tree was challenging. It required efficient handling of asynchronous requests and state management to ensure the app remained responsive and accurate.

## Skills Learned
#### Hardware Programming: 
I gained practical experience in programming Neopixel LEDs and integrating them with a Raspberry Pi. Understanding the intricacies of LED control and hardware timing was crucial for this project.

#### Web Development: 
Developing the web app enhanced my skills in front-end development using HTML, CSS, and JavaScript. Creating a user-friendly interface that effectively communicated with the Flask server was a key part of the project.

#### Backend Development: 
Working with Flask to create a robust backend server improved my skills in backend development and API design. I learned how to handle authentication, manage processes, and ensure secure communication between the client and server.

#### Image Processing: 
Implementing the Pokémon color feature required me to learn about image processing techniques, including working with the Pillow library to manipulate and analyze images. This was a new area for me and provided a valuable learning experience.

----

Overall, this project was a great opportunity to combine creativity with technical skills, resulting in a fun and interactive way to control my Christmas tree lights. The challenges I faced and the skills I learned will undoubtedly be valuable in future projects.
