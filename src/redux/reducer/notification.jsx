import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const notify = (title, body, type) =>
    toast(
        <>
        <span className="">{body}</span>
        </>,
        {
        type: type,
        className: "toast--" + type,
        }
    );

const initialState = { show: false };

const notificationSlice = createSlice({
    name: "notification",
    initialState,
    reducers: {
        show(state, action) {
        const { title, body, type } = action.payload;
        notify(title, body, type);
        },
    },
});

export const { show } = notificationSlice.actions;
export default notificationSlice.reducer;