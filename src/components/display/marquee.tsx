import "marqueemarquee.css";
import React from "react";
import { twc } from "react-twc";

const Container = twc.div`m-4 p-4 border rounded bg-gray-100 overflow-hidden`;
const MarqueeText = twc.p`text-lg flex space-x-2 animate-marquee`;

const Marquee: React.FC<{ text: string }> = ({ text }) => (
  <Container>
    <MarqueeText>{text}</MarqueeText>
  </Container>
);

export default Marquee;
