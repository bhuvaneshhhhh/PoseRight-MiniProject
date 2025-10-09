// Enum for keypoints
export const POSE_LANDMARKS = [
    'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
    'right_eye_inner', 'right_eye', 'right_eye_outer', 'left_ear',
    'right_ear', 'mouth_left', 'mouth_right', 'left_shoulder',
    'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist',
    'right_wrist', 'left_pinky', 'right_pinky', 'left_index',
    'right_index', 'left_thumb', 'right_thumb', 'left_hip',
    'right_hip', 'left_knee', 'right_knee', 'left_ankle',
    'right_ankle', 'left_heel', 'right_heel', 'left_foot_index',
    'right_foot_index',
];

// Define connections for drawing the skeleton
export const POSE_CONNECTIONS = [
    // Torso
    ['left_shoulder', 'right_shoulder'],
    ['left_hip', 'right_hip'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    // Left Arm
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    // Right Arm
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    // Left Leg
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    // Right Leg
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
];

type AngleRule = {
    p1: string;
    p2: string;
    p3: string;
    angle: { min: number; max: number };
    feedback: string;
};

type Stage = {
    rules: {
        [key: string]: AngleRule;
    };
};

type WorkoutData = {
    stages: {
        [key: string]: Stage;
    };
};

export const WORKOUTS_DATA: { [key: string]: WorkoutData } = {
    SQUAT: {
        stages: {
            down: {
                rules: {
                    knee: {
                        p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle',
                        angle: { min: 70, max: 110 },
                        feedback: "You're not going low enough. Try to break parallel."
                    },
                    back: {
                        p1: 'left_shoulder', p2: 'left_hip', p3: 'left_knee',
                        angle: { min: 80, max: 120 },
                        feedback: "Keep your chest up and back straight."
                    }
                }
            },
            up: {
                rules: {
                     knee: {
                        p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle',
                        angle: { min: 160, max: 190 },
                        feedback: "Stand up all the way to complete the rep."
                    },
                     back: {
                        p1: 'left_shoulder', p2: 'left_hip', p3: 'left_knee',
                        angle: { min: 160, max: 190 },
                        feedback: "Keep your back straight as you stand up."
                    }
                }
            }
        }
    },
    STANDING: {
        stages: {
            up: {
                rules: {
                    knee: {
                        p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle',
                        angle: { min: 170, max: 190 },
                        feedback: "Your knees are slightly bent."
                    },
                    hip: {
                        p1: 'left_shoulder', p2: 'left_hip', p3: 'left_knee',
                        angle: { min: 170, max: 190 },
                        feedback: "You are leaning forward slightly."
                    }
                }
            }
        }
    }
};
