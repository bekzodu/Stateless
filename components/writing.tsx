"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { toast } from "sonner";

const DEFAULT_TIMEOUT = 7; // 7 seconds timeout
const MIN_SESSION_TIME = 5; // 5 minutes
const MAX_SESSION_TIME = 180; // 180 minutes

export function Writing() {
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(15); // Default 15 minutes
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastKeystroke, setLastKeystroke] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(DEFAULT_TIMEOUT);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for timeout
  useEffect(() => {
    if (!isActive) return;

    const checkTimeout = () => {
      const now = Date.now();
      const elapsed = (now - lastKeystroke) / 1000;

      if (lastKeystroke && elapsed > timeoutSeconds) {
        // Text deleted due to inactivity
        setText("");
        toast.error(`You stopped typing for ${timeoutSeconds} seconds. Your text has been deleted.`);
      }
    };

    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [isActive, lastKeystroke, timeoutSeconds]);

  // Session timer
  useEffect(() => {
    if (!isActive) return;

    setTimeRemaining(sessionTime * 60);

    sessionTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // End session
          endSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isActive, sessionTime]);

  const startSession = () => {
    setIsActive(true);
    setLastKeystroke(Date.now());
    setText("");
    // Focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
    toast.success(`Session started! Keep typing or lose your work after ${timeoutSeconds} seconds of inactivity.`);
  };

  const endSession = (completed = false) => {
    setIsActive(false);
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    
    if (completed) {
      toast.success("Congratulations! You completed your writing session.");
    } else {
      toast.info("Session ended. Your text has been preserved.");
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setLastKeystroke(Date.now());
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = isActive 
    ? ((sessionTime * 60 - timeRemaining) / (sessionTime * 60)) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <Card className="border-pink-300">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-primary">Writing Session</CardTitle>
              <CardDescription>
                {isActive 
                  ? `Time remaining: ${formatTime(timeRemaining)}` 
                  : `Session length: ${sessionTime} minutes`}
              </CardDescription>
            </div>
            
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-pink-200 hover:bg-pink-100" disabled={isActive}>
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Session Settings</DialogTitle>
                  <DialogDescription>
                    Configure your writing session parameters.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Session Length: {sessionTime} minutes
                    </label>
                    <Slider 
                      min={MIN_SESSION_TIME} 
                      max={MAX_SESSION_TIME} 
                      step={5}
                      value={[sessionTime]} 
                      onValueChange={(value) => setSessionTime(value[0])}
                      className="bg-pink-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Timeout: {timeoutSeconds} seconds
                    </label>
                    <Slider 
                      min={3} 
                      max={15} 
                      step={1}
                      value={[timeoutSeconds]} 
                      onValueChange={(value) => setTimeoutSeconds(value[0])}
                      className="bg-pink-100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your text will be deleted if you stop typing for this long.
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button onClick={() => setShowSettings(false)}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {isActive ? (
            <>
              <Progress value={progressPercentage} className="h-2 mb-4" />
              <Textarea
                ref={textareaRef}
                placeholder="Start typing... if you stop for more than 7 seconds, everything will be deleted!"
                value={text}
                onChange={handleTextChange}
                className="min-h-[300px] resize-none focus-visible:ring-pink-400"
                disabled={!isActive}
              />
            </>
          ) : (
            <div className="bg-pink-50 p-8 rounded-md text-center">
              <h3 className="text-lg font-semibold mb-2">Welcome to Stateless</h3>
              <p className="mb-6 text-gray-700">
                When you begin a timed session, you must keep typing; if you stop for more than {timeoutSeconds} seconds, 
                all your text disappears. This feature aims to trigger "flow," a highly focused mental state.
              </p>
              <AnimatedBackground 
                className="rounded-md overflow-hidden" 
                enableHover={true}
              >
                <Button 
                  onClick={startSession} 
                  size="lg" 
                  className="bg-pink-500 hover:bg-pink-600"
                  data-id="start"
                >
                  Start {sessionTime}-Minute Session
                </Button>
              </AnimatedBackground>
            </div>
          )}
        </CardContent>
        
        {isActive && (
          <CardFooter>
            <Button 
              onClick={() => endSession()} 
              variant="outline" 
              className="ml-auto border-pink-200 hover:bg-pink-100"
            >
              End Session
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {isActive && (
        <div className="text-sm text-center text-muted-foreground">
          <p>Keep typing! {timeoutSeconds} seconds of inactivity will delete all your text.</p>
        </div>
      )}
    </div>
  );
}