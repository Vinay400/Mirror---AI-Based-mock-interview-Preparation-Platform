import api from "./axios";

export const startInterview = (data) => {
    return api.post("/interview/start", data);

}

export const getInterview = (id) => {
    return api.get(`/interview/${id}`);

}
export const uploadAudio = (formData) => {
    return api.post("/interview/upload-audio", formData);
}
export const submitInterview = (id) => {
    return api.post(`/interview/${id}/submit`);
}

export const getUserInterviews = () => {
    return api.get("/interview");
}
