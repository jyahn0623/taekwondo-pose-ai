import React, { createRef, useRef } from "react";
import logo from './logo.svg';

import '@tensorflow/tfjs-backend-webgl';
import * as posenet from '@tensorflow-models/posenet';
import { poseSimilarity } from 'posenet-similarity';

import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./utils/drawing";
import './App.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const correctSound = new Audio(require('./correct.mp3'));

class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      video_src : require('../src/video/jang_1/pose1.mp4'),
      user_stream : null,
      isLoading : false,
      similarity : 0,
      seqNo : 0,
    };

    this.poseData = null;
    this.seqData = null;
    this.seqNo = 0;
    this.targetSimilarity = 0.02;
    this.score = 0;

    this.user_video = createRef();
    this.canvas_ref = createRef();
    // this.tutorial_canvas_ref = createRef();

    this.net = undefined;
    this.pose = undefined;

    this.lastpose = null;
    this.loadingTime = null;


  }

  loadPoseData = async() => {
    // const response = await Promise.all([
    //   fetch(`./video/jang_1/pose.json`),
    //   // fetch(`./${this.poomsaeCurNo}jang/sequence.json`)
    // ]);
    this.poseData = require('../src/video/jang_1/pose.json');
    this.seqData = require('../src/video/jang_1/sequence.json');
  }

  componentDidMount = async () => {
    await this.loadPoseData();
    await this.getUserMedia();
    await this.setup();
  }

  setup = async() => {
    const net = await posenet.load({});
    
    setInterval(() => {
      this.detect(net);
    }, 100)
   };
  
  detect = async (net) => {
    const target_pose = this.poseData[this.seqNo];
    const video = this.user_video.current.video;
    const videoWidth = this.user_video.current.videoWidth;
    const videoHeight = this.user_video.current.videoHeight;
    
    this.user_video.current.width = videoWidth;
    this.user_video.current.height = videoHeight;
    
    const pose = await net.estimateSinglePose(this.user_video.current);
    this.drawCanvas(pose, videoWidth, videoHeight, this.canvas_ref);
    // this.drawCanvas(target_pose, videoWidth, videoHeight, this.tutorial_canvas_ref);

    const similarity = poseSimilarity(
      target_pose,
      pose,
      { strategy: "weightedDistance" }
      );
    
      this.setState({
        similarity : similarity.toFixed(5),
      });

    if (similarity <= this.targetSimilarity){
      console.log(this.state.isLoading);
      if (this.state.isLoading){
        return;
      }
      toast("올바른 동작입니다!");
      correctSound.play();
      
      this.seqNo += 1;
      this.setState({
        video_src : require(`../src/video/jang_1/pose${this.seqNo}.mp4`),
        seqNo : this.seqNo,
        isLoading : true, 
      });

      setTimeout(() => {
        this.setState({
          isLoading : false,
        });
      }, 1000);
    }
  
    // 0이 될수록 정확한 것.
  }


  drawCanvas = (pose, width, height, canvas) => {
    const ctx = canvas.current.getContext('2d');
    canvas.current.width = width;
    canvas.current.height = height;
    
    drawKeypoints(pose["keypoints"], 0.7, ctx);
    drawSkeleton(pose["keypoints"], 0.7, ctx);
  }
  
  getUserMedia = async () => {
    const constraints = {
      'video': {
          width: 800,
          height: 800
      },
      'audio': false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.user_video.current.srcObject = stream;
    this.user_video.current.muted = true;
  }

  render() {
    return (
      <div className="App">
        <img src={require("./taekwondo.png")} style={{width : 100}}/>
        <h1>태권도 품새 도우미</h1>
        <div className="header">
          <h2>동작 유사도 : {this.state.similarity}</h2>
          <h2>완료한 동작 : <span style={{color : 'blue'}}>{this.poseData && this.poseData.length}개</span> 동작 중  <span style={{color : 'red'}}>{this.state.seqNo} 동작</span> 성공!</h2>
        </div>
        <div className="sub">
          <div className="row">
            <div className="container">
              <h2>내 화면</h2>
              <div className="inner">
                <video ref={this.user_video} id="video" width="500" height="500" muted autoPlay/> 
                <canvas className="user_video" ref={this.canvas_ref} id="output" width="500" height="500"/>
                {/* <canvas ref={this.tutorial_canvas_ref} id="tutorial_canvas" width="800" height="800"/> */}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="container">
            <h2>도우미 화면</h2>
              <video key={this.state.video_src} id="video2" width="800" height="800" muted controls autoPlay>
                <source src={this.state.video_src} type="video/mp4"/>
              </video>
            </div>
          </div>
      </div>
      <div>
        <ToastContainer 
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
    );
  }
}

export default App;
