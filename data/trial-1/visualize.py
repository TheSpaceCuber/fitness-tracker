import matplotlib.pyplot as plt
import pandas as pd
import sys

def run():
    df = pd.read_csv(sys.argv[1])

    plt.plot(df['Time'], df['X'])
    plt.plot(df['Time'], df['Y'])
    plt.plot(df['Time'], df['Z'])
    
    plt.show()

if __name__ == '__main__':
    run()

# command example: python visualize.py stationary.csv
