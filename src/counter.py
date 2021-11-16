from statistics import mean
from scipy.signal import savgol_filter
import numpy as np

'''
This module contains code required for peak detection and is used to calculate the number of peaks in the accelerometer data.   
The code is based on the following:
https://stackoverflow.com/questions/20618804/how-to-smooth-a-curve-in-the-right-way
https://stackoverflow.com/questions/22583391/peak-signal-detection-in-realtime-timeseries-data/#answer-22583761
'''

def detect_peaks(values: list, step: int=2, min_diff: float=0.001) -> list:
    '''
    Return the indices of peaks in the given 1D array. Used in get_count().
    Step determines how much difference between each check.
    Min_diff is the min height between two points for the middle to be maxima.
    '''
    peaks_test = []
    i = step
    while (i < len(values) - step - step):
        prev_prev = values[i-step-step]
        prev = values[i-step]
        curr = values[i]
        after = values[i+step]
        after_after = values[i+step+step]
        # if considered to be a peak in real time
        if ((curr - prev > min_diff) and (curr - after > min_diff) and # if local maxima
            (prev - prev_prev > min_diff) and (after - after_after > min_diff) and # extra check
            curr > mean(values)): # check if local maxima detected is above average
            peaks_test.append(i)
            i = i + 10 # TODO what is a
            continue
        i = i + 1 # check next point if no maxima detected
    return np.array(peaks_test)

def get_peaks(accelZ_arr: list) -> list:
    '''
    Returns an array of peaks
    '''
    length = len(accelZ_arr)
    if length < 5: # too short to perform smoothing, skip
        return 
    if length >= 5 and length < 21: # smoothing with small window
        smoothed_values = savgol_filter(accelZ_arr, window_length=5, polyorder=2) # change this to smooth curve!
    else: # smoothing with standard window
        smoothed_values = savgol_filter(accelZ_arr, window_length=21, polyorder=2) # change this to smooth curve!
    # calculate peaks
    peaks = detect_peaks(smoothed_values, step=1, min_diff=0.001) # change this adjust peak detection!
    return peaks

def get_count(accelZ_arr: list) -> int:
    '''
    Returns the no of peaks (local maxima) from an array of values.
    Keep calling this function on live data stream to get the count.
    '''
    if len(accelZ_arr) < 5:
        return 0 # too short
    return len(get_peaks(accelZ_arr))

def get_speed(accelZ_arr: list, min_normal=17, max_normal=23):
    '''
    Returns fast or slow or normal depending on the distance between the last two peaks.
    '''
    NORMAL = 0
    FAST = 1
    SLOW = -1
    if len(accelZ_arr) < 5:
        return NORMAL
    peaks = get_peaks(accelZ_arr)
    if len(peaks) < 2:
        return NORMAL

    if peaks[-1] - peaks[-2] < min_normal:     
        return SLOW
    elif peaks[-1] - peaks[-2] > max_normal:
        return FAST
    else:
        return NORMAL