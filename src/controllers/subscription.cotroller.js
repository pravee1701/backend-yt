import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Subscription } from "../models/subscription.model";


const toggleSubscription = asyncHandler(async(req, res) => {
    const { chaneelId } = req.params

    if(!isValidObjectId(chaneelId)){
        throw new ApiError(400, "Invalid channel id")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: chaneelId
    })

    if(isSubscribed){
        const unsubscribed = await Subscription.findByIdAndDelete(isSubscribed?._id)

        if(!unsubscribed){
            throw new ApiError(500, "Failed to unsubscribe")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, {subscribed: false}, "unsubscribed successfully"))
    }

    const subscribed = await Subscription.create({
        subscriber: req.user?._id,
        channel: chaneelId
    })

    if(!subscribed){
        throw new ApiError(500, "Failed to subscribe")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {subscribed: true}, "Subscribed successfully"))
})


const getUserChannelSubscribers = asyncHandler(async(req, res) => {
    const { channelId } = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber"
                        }
                    },
                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId,
                                            "$subscribedToSubscriber.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false,
                                }
                            },
                            
                            subscriberCount: {
                                $size: "$subscribedToSubscriber"
                            }
                            
                        },
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber"
        },{
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username:1, 
                    fullName: 1,
                    avatar: 1,
                    subscribedToSubscriber: 1,
                    subscriberCount: 1
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})


const getSubscribedChannel = asyncHandler(async(req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriber id")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos"
                        }
                    },
                    {
                        $addFields: {
                            latestvideo: {
                                $last: "$videos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedChannel"
        },
        {
            $project: {
                _id: 0,
                subscribedChannel: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    latestvideo: {
                        _id: 1,
                        videoFile: 1,
                        thumbnail: 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1, 
                        createdAt: 1,
                        views: 1,
                    }
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "subscribed channel fetched successfully"))


})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannel
}